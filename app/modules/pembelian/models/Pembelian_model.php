<?php

require_once APP_PATH . '/core/Model.php';

class Pembelian_model extends Model
{

    public function getPurchaseRequestsToProcess()
    {

        $query = "
            SELECT 
                p.*, 
                u.nama_lengkap as nama_pemohon,
                (SELECT COUNT(*) FROM tbl_detail_permintaan_atk WHERE id_permintaan = p.id_permintaan) as jumlah_item,
                (SELECT GROUP_CONCAT(COALESCE(b.nama_barang, d.nama_barang_custom) SEPARATOR ', ') 
                 FROM tbl_detail_permintaan_atk d 
                 LEFT JOIN tbl_barang b ON d.id_barang = b.id_barang 
                 WHERE d.id_permintaan = p.id_permintaan) as nama_items
            FROM tbl_permintaan_atk p
            JOIN tbl_pengguna u ON p.id_pengguna_pemohon = u.id_pengguna
            WHERE p.tipe_permintaan = 'pembelian' AND p.status_permintaan = 'Diproses Pembelian'
            ORDER BY p.tanggal_permintaan DESC
        ";

        return $this->fetchAll($query);
    }

    // [FITUR BARU] Method untuk mengubah status menjadi "Sudah Dibeli"
    public function markAsPurchased($id, $user_id)
    {

        $this->beginTransaction();
        try
        {
            $stmt = $this->query("UPDATE tbl_permintaan_atk SET status_permintaan = 'Sudah Dibeli', id_pengguna_pembelian = :id_pengguna_pembelian WHERE id_permintaan = :id_permintaan AND status_permintaan = 'Diproses Pembelian'", [
                'id_pengguna_pembelian' => $user_id,
                'id_permintaan' => $id,
            ]);

            if ($stmt->rowCount() === 0)
            {
                throw new Exception("Gagal memperbarui status. Permintaan mungkin sudah diproses atau tidak ditemukan.");
            }

            $this->commit();
            return [ 'success' => TRUE, 'message' => 'Permintaan berhasil ditandai sebagai "Sudah Dibeli".' ];
        } catch (Exception $e)
        {
            $this->rollback();
            log_query('', $e->getMessage());
            $msg = (ENVIRONMENT === 'development') ? $e->getMessage() : 'Terjadi kesalahan saat memproses data.';
            return [ 'success' => FALSE, 'message' => $msg ];
        }
    }

}
