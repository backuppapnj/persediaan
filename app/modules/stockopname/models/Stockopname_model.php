<?php

require_once APP_PATH . '/core/Model.php';

class Stockopname_model extends Model
{

    public function getHistory()
    {

        $query = "
            SELECT so.*, u.nama_lengkap as nama_penanggung_jawab
            FROM tbl_stock_opname so
            JOIN tbl_pengguna u ON so.id_pengguna_penanggung_jawab = u.id_pengguna
            ORDER BY so.tanggal_opname DESC, so.id_opname DESC
        ";

        return $this->fetchAll($query);
    }

    public function getOpnameDetailsById($id_opname)
    {

        $response = [ 'main' => NULL, 'items' => [] ];

        // Get main data
        $main_data = $this->fetchOne("
            SELECT so.*, u.nama_lengkap as nama_penanggung_jawab
            FROM tbl_stock_opname so
            JOIN tbl_pengguna u ON so.id_pengguna_penanggung_jawab = u.id_pengguna
            WHERE so.id_opname = :id_opname
        ", ['id_opname' => $id_opname]);

        if (!$main_data)
        {
            return NULL;
        }
        $response['main'] = $main_data;

        // Get item details
        $response['items'] = $this->fetchAll("
            SELECT 
                dso.*, 
                b.nama_barang, 
                b.kode_barang
            FROM tbl_detail_stock_opname dso
            JOIN tbl_barang b ON dso.id_barang = b.id_barang
            WHERE dso.id_opname = :id_opname
            ORDER BY b.nama_barang ASC
        ", ['id_opname' => $id_opname]);

        return $response;
    }

    public function getLatestStockData()
    {

        $query = "
            SELECT id_barang, kode_barang, nama_barang, stok_umum, stok_perkara 
            FROM tbl_barang WHERE deleted_at IS NULL ORDER BY nama_barang ASC
        ";
        return $this->fetchAll($query);
    }

    public function isOpnameFinalizedForCurrentMonth()
    {

        $result = $this->fetchOne("SELECT COUNT(*) as total FROM tbl_stock_opname WHERE MONTH(tanggal_opname) = MONTH(CURDATE()) AND YEAR(tanggal_opname) = YEAR(CURDATE()) AND status = 'Selesai'");
        return $result['total'] > 0;
    }

    public function saveOpname($keterangan, $items, $user_id)
    {

        if (empty($items))
        {
            return [ 'success' => FALSE, 'message' => 'Tidak ada data barang yang diproses.' ];
        }

        $this->beginTransaction();
        try
        {
            $kode_opname = "OPN-" . date("Ymd-His");
            // [DIUBAH] Menambahkan status 'Selesai' saat menyimpan
            $this->query(
                "INSERT INTO tbl_stock_opname (kode_opname, tanggal_opname, id_pengguna_penanggung_jawab, keterangan, status) VALUES (:kode_opname, CURDATE(), :id_pengguna_penanggung_jawab, :keterangan, 'Selesai')",
                [
                    'kode_opname' => $kode_opname,
                    'id_pengguna_penanggung_jawab' => $user_id,
                    'keterangan' => $keterangan,
                ]
            );
            $id_opname = $this->db->lastInsertId();

            foreach ($items as $item)
            {
                $id_barang           = (int) $item['id_barang'];
                $stok_sistem_umum    = (int) $item['stok_sistem_umum'];
                $stok_sistem_perkara = (int) $item['stok_sistem_perkara'];
                $stok_fisik_umum     = (int) $item['stok_fisik_umum'];
                $stok_fisik_perkara  = (int) $item['stok_fisik_perkara'];
                $selisih_umum        = $stok_fisik_umum - $stok_sistem_umum;
                $selisih_perkara     = $stok_fisik_perkara - $stok_sistem_perkara;
                $catatan             = $item['catatan'] ?? NULL;

                $this->query(
                    "INSERT INTO tbl_detail_stock_opname (id_opname, id_barang, stok_sistem_umum, stok_sistem_perkara, stok_fisik_umum, stok_fisik_perkara, selisih_umum, selisih_perkara, catatan) VALUES (:id_opname, :id_barang, :stok_sistem_umum, :stok_sistem_perkara, :stok_fisik_umum, :stok_fisik_perkara, :selisih_umum, :selisih_perkara, :catatan)",
                    [
                        'id_opname' => $id_opname,
                        'id_barang' => $id_barang,
                        'stok_sistem_umum' => $stok_sistem_umum,
                        'stok_sistem_perkara' => $stok_sistem_perkara,
                        'stok_fisik_umum' => $stok_fisik_umum,
                        'stok_fisik_perkara' => $stok_fisik_perkara,
                        'selisih_umum' => $selisih_umum,
                        'selisih_perkara' => $selisih_perkara,
                        'catatan' => $catatan,
                    ]
                );

                if (($stok_sistem_umum !== $stok_fisik_umum) || ($stok_sistem_perkara !== $stok_fisik_perkara))
                {
                    $this->query(
                        "UPDATE tbl_barang SET stok_umum = :stok_umum, stok_perkara = :stok_perkara WHERE id_barang = :id_barang",
                        [
                            'stok_umum' => $stok_fisik_umum,
                            'stok_perkara' => $stok_fisik_perkara,
                            'id_barang' => $id_barang,
                        ]
                    );
                }

                $jumlah_ubah_total = ($stok_fisik_umum + $stok_fisik_perkara) - ($stok_sistem_umum + $stok_sistem_perkara);
                $log_keterangan    = "Stock Opname: {$kode_opname}.";

                $this->query(
                    "INSERT INTO tbl_log_stok (id_barang, jenis_transaksi, jumlah_ubah, stok_sebelum_umum, stok_sesudah_umum, stok_sebelum_perkara, stok_sesudah_perkara, id_referensi, keterangan, id_pengguna_aksi) VALUES (:id_barang, 'penyesuaian', :jumlah_ubah, :stok_sebelum_umum, :stok_sesudah_umum, :stok_sebelum_perkara, :stok_sesudah_perkara, :id_referensi, :keterangan, :id_pengguna_aksi)",
                    [
                        'id_barang' => $id_barang,
                        'jumlah_ubah' => $jumlah_ubah_total,
                        'stok_sebelum_umum' => $stok_sistem_umum,
                        'stok_sesudah_umum' => $stok_fisik_umum,
                        'stok_sebelum_perkara' => $stok_sistem_perkara,
                        'stok_sesudah_perkara' => $stok_fisik_perkara,
                        'id_referensi' => $id_opname,
                        'keterangan' => $log_keterangan,
                        'id_pengguna_aksi' => $user_id,
                    ]
                );
            }

            $this->commit();
            return [ 'success' => TRUE, 'message' => 'Stock opname berhasil disimpan.' ];

        } catch (Exception $e)
        {
            $this->rollback();
            log_query("Save Stock Opname", $e->getMessage());
            $msg = (ENVIRONMENT === 'development') ? $e->getMessage() : 'Gagal menyimpan data stock opname.';
            return [ 'success' => FALSE, 'message' => $msg ];
        }
    }

}
