<?php

require_once APP_PATH . '/core/Model.php';

class Permintaan_model extends Model
{

    public function getAllRequests($user_id, $role)
    {

        $query = "
            SELECT 
                p.*, 
                u.nama_lengkap as nama_pemohon
            FROM tbl_permintaan_atk p
            JOIN tbl_pengguna u ON p.id_pengguna_pemohon = u.id_pengguna
        ";
        $params = [];
        if (strtolower($role) === 'pegawai')
        {
            $query .= " WHERE p.id_pengguna_pemohon = :id_pengguna_pemohon";
            $params['id_pengguna_pemohon'] = intval($user_id);
        }
        $query .= " ORDER BY p.tanggal_permintaan DESC, p.id_permintaan DESC";
        return $this->fetchAll($query, $params);
    }

    public function getRequestDetailsById($id)
    {

        $data      = [];
        $result_main = $this->fetchOne("
            SELECT p.*, u.nama_lengkap as nama_pemohon, approver.nama_lengkap as nama_penyetuju
            FROM tbl_permintaan_atk p
            JOIN tbl_pengguna u ON p.id_pengguna_pemohon = u.id_pengguna
            LEFT JOIN tbl_pengguna approver ON p.id_pengguna_penyetuju = approver.id_pengguna
            WHERE p.id_permintaan = :id_permintaan
        ", ['id_permintaan' => $id]);

        if ($result_main)
        {
            $data['main'] = $result_main;

            $data['items'] = $this->fetchAll("
                SELECT 
                    d.id_detail_permintaan,
                    d.jumlah_diminta,
                    d.jumlah_disetujui,
                    d.status_item,
                    COALESCE(b.nama_barang, d.nama_barang_custom) as nama_barang,
                    s.nama_satuan,
                    (b.stok_umum + b.stok_perkara) AS stok_total
                FROM tbl_detail_permintaan_atk d
                LEFT JOIN tbl_barang b ON d.id_barang = b.id_barang
                LEFT JOIN tbl_satuan_barang s ON b.id_satuan = s.id_satuan
                WHERE d.id_permintaan = :id_permintaan
            ", ['id_permintaan' => $id]);
        }
        return $data;
    }

    public function createRequest($data, $user_id, $tipe_permintaan)
    {

        $this->beginTransaction();
        try
        {
            $kode_permintaan = "REQ-" . date("Ymd") . "-" . strtoupper(uniqid());

            $this->query(
                "INSERT INTO tbl_permintaan_atk (kode_permintaan, id_pengguna_pemohon, tanggal_permintaan, catatan_pemohon, tipe_permintaan) VALUES (:kode_permintaan, :id_pengguna_pemohon, CURDATE(), :catatan_pemohon, :tipe_permintaan)",
                [
                    'kode_permintaan' => $kode_permintaan,
                    'id_pengguna_pemohon' => $user_id,
                    'catatan_pemohon' => $data['catatan'],
                    'tipe_permintaan' => $tipe_permintaan,
                ]
            );
            $id_permintaan = $this->db->lastInsertId();

            foreach ($data['items'] as $item)
            {
                $id_barang   = ($item['is_custom'] == FALSE) ? $item['id_barang'] : NULL;
                $nama_custom = ($item['is_custom'] == TRUE) ? $item['nama_barang'] : NULL;
                $jumlah      = intval($item['jumlah']);

                if ($jumlah <= 0) continue;

                $this->query(
                    "INSERT INTO tbl_detail_permintaan_atk (id_permintaan, id_barang, nama_barang_custom, jumlah_diminta) VALUES (:id_permintaan, :id_barang, :nama_barang_custom, :jumlah_diminta)",
                    [
                        'id_permintaan' => $id_permintaan,
                        'id_barang' => $id_barang,
                        'nama_barang_custom' => $nama_custom,
                        'jumlah_diminta' => $jumlah,
                    ]
                );
            }

            $this->commit();
            return [ 'success' => TRUE, 'message' => 'Permintaan berhasil dibuat.' ];
        } catch (Exception $e)
        {
            $this->rollback();
            log_query("INSERT INTO tbl_permintaan_atk", $e->getMessage());
            $error_message = 'Terjadi kesalahan saat menyimpan data.';
            if (ENVIRONMENT === 'development')
            {
                $error_message .= " Pesan SQL: " . $e->getMessage();
            }
            return [ 'success' => FALSE, 'message' => $error_message ];
        }
    }

    public function approveRequest($id, $approver_id, $catatan, $items)
    {

        $this->beginTransaction();
        try
        {
            $permintaan = $this->fetchOne("SELECT tipe_permintaan FROM tbl_permintaan_atk WHERE id_permintaan = :id_permintaan AND status_permintaan = 'Diajukan'", ['id_permintaan' => $id]);

            if (!$permintaan)
            {
                throw new Exception("Permintaan tidak ditemukan atau sudah diproses.");
            }
            $is_permintaan_stok = ($permintaan['tipe_permintaan'] == 'stok');
            $status_final       = $is_permintaan_stok ? 'Selesai' : 'Diproses Pembelian';

            foreach ($items as $item)
            {
                $detail_id        = intval($item['id']);
                $jumlah_disetujui = intval($item['jumlah']);

                $item_db = $this->fetchOne("
                    SELECT 
                        d.id_barang, d.jumlah_diminta, b.stok_umum, b.stok_perkara,
                        COALESCE(b.nama_barang, d.nama_barang_custom) as nama_barang
                    FROM tbl_detail_permintaan_atk d
                    LEFT JOIN tbl_barang b ON d.id_barang = b.id_barang
                    WHERE d.id_detail_permintaan = :id_detail_permintaan
                ", ['id_detail_permintaan' => $detail_id]);

                if (!$item_db) throw new Exception("Detail item tidak ditemukan.");

                $stok_total_db = ($item_db['stok_umum'] ?? 0) + ($item_db['stok_perkara'] ?? 0);
                if ($jumlah_disetujui > $item_db['jumlah_diminta']) throw new Exception("Jumlah disetujui untuk '{$item_db['nama_barang']}' melebihi jumlah diminta.");

                if ($is_permintaan_stok && $item_db['id_barang'])
                {
                    if ($jumlah_disetujui > $stok_total_db)
                    {
                        throw new Exception("Jumlah disetujui untuk '{$item_db['nama_barang']}' melebihi stok total ({$stok_total_db}).");
                    }

                    if ($jumlah_disetujui > 0)
                    {
                        $stok_sebelum_umum    = $item_db['stok_umum'];
                        $stok_sebelum_perkara = $item_db['stok_perkara'];

                        $pengurangan_dari_umum    = min($stok_sebelum_umum, $jumlah_disetujui);
                        $sisa_pengurangan         = $jumlah_disetujui - $pengurangan_dari_umum;
                        $pengurangan_dari_perkara = min($stok_sebelum_perkara, $sisa_pengurangan);

                        $this->query(
                            "UPDATE tbl_barang SET stok_umum = stok_umum - :pengurangan_dari_umum, stok_perkara = stok_perkara - :pengurangan_dari_perkara WHERE id_barang = :id_barang",
                            [
                                'pengurangan_dari_umum' => $pengurangan_dari_umum,
                                'pengurangan_dari_perkara' => $pengurangan_dari_perkara,
                                'id_barang' => $item_db['id_barang'],
                            ]
                        );

                        $stok_sesudah_umum    = $stok_sebelum_umum - $pengurangan_dari_umum;
                        $stok_sesudah_perkara = $stok_sebelum_perkara - $pengurangan_dari_perkara;
                        $keterangan_log       = "Pengeluaran stok untuk permintaan #" . $id;
                        $this->query(
                            "INSERT INTO tbl_log_stok (id_barang, jenis_transaksi, jumlah_ubah, stok_sebelum_umum, stok_sesudah_umum, stok_sebelum_perkara, stok_sesudah_perkara, id_referensi, keterangan, id_pengguna_aksi) VALUES (:id_barang, 'keluar', :jumlah_ubah, :stok_sebelum_umum, :stok_sesudah_umum, :stok_sebelum_perkara, :stok_sesudah_perkara, :id_referensi, :keterangan, :id_pengguna_aksi)",
                            [
                                'id_barang' => $item_db['id_barang'],
                                'jumlah_ubah' => -$jumlah_disetujui,
                                'stok_sebelum_umum' => $stok_sebelum_umum,
                                'stok_sesudah_umum' => $stok_sesudah_umum,
                                'stok_sebelum_perkara' => $stok_sebelum_perkara,
                                'stok_sesudah_perkara' => $stok_sesudah_perkara,
                                'id_referensi' => $detail_id,
                                'keterangan' => $keterangan_log,
                                'id_pengguna_aksi' => $approver_id,
                            ]
                        );
                    }
                }

                $this->query("UPDATE tbl_detail_permintaan_atk SET jumlah_disetujui = :jumlah_disetujui WHERE id_detail_permintaan = :id_detail_permintaan", ['jumlah_disetujui' => $jumlah_disetujui, 'id_detail_permintaan' => $detail_id]);
            }

            $this->query(
                "UPDATE tbl_permintaan_atk SET status_permintaan = :status_permintaan, id_pengguna_penyetuju = :id_pengguna_penyetuju, catatan_penyetuju = :catatan_penyetuju, tanggal_diproses = NOW() WHERE id_permintaan = :id_permintaan",
                [
                    'status_permintaan' => $status_final,
                    'id_pengguna_penyetuju' => $approver_id,
                    'catatan_penyetuju' => $catatan,
                    'id_permintaan' => $id,
                ]
            );

            $this->commit();
            return [ 'success' => TRUE, 'message' => 'Permintaan berhasil diproses.' ];
        } catch (Exception $e)
        {
            $this->rollback();
            log_query('UPDATE tbl_permintaan_atk (approve)', $e->getMessage());
            $msg = (ENVIRONMENT === 'development') ? $e->getMessage() : $e->getMessage();
            return [ 'success' => FALSE, 'message' => $msg ];
        }
    }

    public function rejectRequest($id, $approver_id, $catatan)
    {

        $this->beginTransaction();
        try
        {
            $this->query(
                "UPDATE tbl_permintaan_atk SET status_permintaan = 'Ditolak', id_pengguna_penyetuju = :id_pengguna_penyetuju, catatan_penyetuju = :catatan_penyetuju, tanggal_diproses = NOW() WHERE id_permintaan = :id_permintaan",
                [
                    'id_pengguna_penyetuju' => $approver_id,
                    'catatan_penyetuju' => $catatan,
                    'id_permintaan' => $id,
                ]
            );

            $this->commit();
            return [ 'success' => TRUE, 'message' => 'Permintaan berhasil ditolak.' ];
        } catch (Exception $e)
        {
            $this->rollback();
            log_query('UPDATE tbl_permintaan_atk (reject)', $e->getMessage());
            $msg = (ENVIRONMENT === 'development') ? $e->getMessage() : 'Gagal menolak permintaan.';
            return [ 'success' => FALSE, 'message' => $msg ];
        }
    }

}
