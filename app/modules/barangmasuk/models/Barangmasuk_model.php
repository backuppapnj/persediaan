<?php

require_once APP_PATH . '/core/Model.php';

class Barangmasuk_model extends Model
{

    public function getProcessedPurchaseRequests()
    {

        $query = "
            SELECT p.*, u.nama_lengkap as nama_pemohon,
            (SELECT COUNT(*) FROM tbl_detail_permintaan_atk WHERE id_permintaan = p.id_permintaan) as jumlah_item
            FROM tbl_permintaan_atk p
            JOIN tbl_pengguna u ON p.id_pengguna_pemohon = u.id_pengguna
            WHERE p.tipe_permintaan = 'pembelian' AND p.status_permintaan = 'Sudah Dibeli'
            ORDER BY p.tanggal_permintaan DESC
        ";

        return $this->fetchAll($query);
    }

    public function getRequestDetailsForReceipt($id)
    {

        $query = "
            SELECT 
                d.id_detail_permintaan,
                d.jumlah_disetujui,
                d.nama_barang_custom,
                d.id_barang,
                COALESCE(b.nama_barang, d.nama_barang_custom) as nama_barang
            FROM tbl_detail_permintaan_atk d
            LEFT JOIN tbl_barang b ON d.id_barang = b.id_barang
            WHERE d.id_permintaan = :id_permintaan
        ";
        return $this->fetchAll($query, ['id_permintaan' => $id]);
    }

    public function processReceipt($id_permintaan, $user_id, $itemsAlokasi)
    {

        $this->beginTransaction();
        try
        {
            $no_transaksi = "BM-" . date("Ymd") . "-" . strtoupper(uniqid());
            $this->query(
                "INSERT INTO tbl_barang_masuk (no_transaksi_masuk, id_pemasok, tanggal_masuk, id_pengguna_penerima, id_permintaan_terkait) VALUES (:no_transaksi_masuk, 1, CURDATE(), :id_pengguna_penerima, :id_permintaan_terkait)",
                [
                    'no_transaksi_masuk' => $no_transaksi,
                    'id_pengguna_penerima' => $user_id,
                    'id_permintaan_terkait' => $id_permintaan,
                ]
            );
            $id_barang_masuk = $this->db->lastInsertId();

            foreach ($itemsAlokasi as $alokasi)
            {
                $detail_permintaan_id = intval($alokasi['id_detail_permintaan']);
                $id_barang_final      = intval($alokasi['id_barang']) ?: NULL;
                $nama_barang_custom   = $alokasi['nama_barang_custom'];
                $jumlah_diterima      = intval($alokasi['jumlah_diterima']);

                if ($jumlah_diterima <= 0) continue;

                if (is_null($id_barang_final) && !empty($nama_barang_custom))
                {
                    $kode_baru     = "BRG-NEW-" . strtoupper(uniqid());
                    $this->query(
                        "INSERT INTO tbl_barang (kode_barang, nama_barang, jenis_barang, id_kategori, id_satuan) VALUES (:kode_barang, :nama_barang, 'habis_pakai', 1, 1)",
                        [
                            'kode_barang' => $kode_baru,
                            'nama_barang' => $nama_barang_custom,
                        ]
                    );
                    $id_barang_final = $this->db->lastInsertId();

                    $this->query(
                        "UPDATE tbl_detail_permintaan_atk SET id_barang = :id_barang WHERE id_detail_permintaan = :id_detail_permintaan",
                        [
                            'id_barang' => $id_barang_final,
                            'id_detail_permintaan' => $detail_permintaan_id,
                        ]
                    );
                }

                $this->query(
                    "INSERT INTO tbl_detail_barang_masuk (id_barang_masuk, id_barang, jumlah_diterima, jumlah_umum, jumlah_perkara) VALUES (:id_barang_masuk, :id_barang, :jumlah_diterima, :jumlah_umum, :jumlah_perkara)",
                    [
                        'id_barang_masuk' => $id_barang_masuk,
                        'id_barang' => $id_barang_final,
                        'jumlah_diterima' => $jumlah_diterima,
                        'jumlah_umum' => $alokasi['jumlah_umum'],
                        'jumlah_perkara' => $alokasi['jumlah_perkara'],
                    ]
                );
                $id_detail_masuk = $this->db->lastInsertId();

                if ($id_barang_final)
                {
                    $stok_sebelum = $this->fetchOne("SELECT stok_umum, stok_perkara FROM tbl_barang WHERE id_barang = :id_barang", ['id_barang' => $id_barang_final]) ?: [ 'stok_umum' => 0, 'stok_perkara' => 0 ];

                    $this->query(
                        "UPDATE tbl_barang SET stok_umum = stok_umum + :jumlah_umum, stok_perkara = stok_perkara + :jumlah_perkara WHERE id_barang = :id_barang",
                        [
                            'jumlah_umum' => $alokasi['jumlah_umum'],
                            'jumlah_perkara' => $alokasi['jumlah_perkara'],
                            'id_barang' => $id_barang_final,
                        ]
                    );

                    $stok_sesudah_umum    = $stok_sebelum['stok_umum'] + $alokasi['jumlah_umum'];
                    $stok_sesudah_perkara = $stok_sebelum['stok_perkara'] + $alokasi['jumlah_perkara'];
                    $keterangan_log       = "Penerimaan barang dari permintaan #" . $id_permintaan;
                    $this->query(
                        "INSERT INTO tbl_log_stok (id_barang, jenis_transaksi, jumlah_ubah, stok_sebelum_umum, stok_sesudah_umum, stok_sebelum_perkara, stok_sesudah_perkara, id_referensi, keterangan, id_pengguna_aksi) VALUES (:id_barang, 'masuk', :jumlah_ubah, :stok_sebelum_umum, :stok_sesudah_umum, :stok_sebelum_perkara, :stok_sesudah_perkara, :id_referensi, :keterangan, :id_pengguna_aksi)",
                        [
                            'id_barang' => $id_barang_final,
                            'jumlah_ubah' => $jumlah_diterima,
                            'stok_sebelum_umum' => $stok_sebelum['stok_umum'],
                            'stok_sesudah_umum' => $stok_sesudah_umum,
                            'stok_sebelum_perkara' => $stok_sebelum['stok_perkara'],
                            'stok_sesudah_perkara' => $stok_sesudah_perkara,
                            'id_referensi' => $id_detail_masuk,
                            'keterangan' => $keterangan_log,
                            'id_pengguna_aksi' => $user_id,
                        ]
                    );
                }

                $this->query("UPDATE tbl_detail_permintaan_atk SET status_item = 'Selesai Diterima' WHERE id_detail_permintaan = :id_detail_permintaan", ['id_detail_permintaan' => $detail_permintaan_id]);
            }

            $sisa_item = $this->fetchOne("SELECT COUNT(*) as total FROM tbl_detail_permintaan_atk WHERE id_permintaan = :id_permintaan AND status_item IS NULL", ['id_permintaan' => $id_permintaan])['total'];

            if ($sisa_item == 0)
            {
                $this->query("UPDATE tbl_permintaan_atk SET status_permintaan = 'Selesai' WHERE id_permintaan = :id_permintaan", ['id_permintaan' => $id_permintaan]);
            }

            $this->commit();
            return [ 'success' => TRUE, 'message' => 'Penerimaan barang berhasil diproses.' ];
        } catch (Exception $e)
        {
            $this->rollback();
            log_query("Proses Penerimaan", $e->getMessage());
            $msg = (ENVIRONMENT === 'development') ? $e->getMessage() : 'Terjadi kesalahan saat memproses penerimaan.';
            return [ 'success' => FALSE, 'message' => $msg ];
        }
    }

}
