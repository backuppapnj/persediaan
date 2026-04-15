<?php
require_once APP_PATH . '/core/Model.php';
class Barang_model extends Model
{
    public function getAllActive()
    {
        $query = "
            SELECT 
                b.*, 
                k.nama_kategori, 
                s.nama_satuan,
                (b.stok_umum + b.stok_perkara) AS stok_total
            FROM tbl_barang b
            LEFT JOIN tbl_kategori_barang k ON b.id_kategori = k.id_kategori
            LEFT JOIN tbl_satuan_barang s ON b.id_satuan = s.id_satuan
            WHERE b.deleted_at IS NULL 
            ORDER BY b.nama_barang ASC
        ";
        return $this->fetchAll($query);
    }
    public function getById( $id )
    {
        $query = "
            SELECT 
                b.*, 
                k.nama_kategori, 
                s.nama_satuan,
                (b.stok_umum + b.stok_perkara) AS stok_total
            FROM tbl_barang b
            LEFT JOIN tbl_kategori_barang k ON b.id_kategori = k.id_kategori
            LEFT JOIN tbl_satuan_barang s ON b.id_satuan = s.id_satuan
            WHERE b.id_barang = :id AND b.deleted_at IS NULL
        ";
        return $this->fetchOne($query, ['id' => $id]);
    }
    public function getAllKategori()
    {
        return $this->fetchAll("SELECT * FROM tbl_kategori_barang ORDER BY nama_kategori ASC");
    }
    public function getAllSatuan()
    {
        return $this->fetchAll("SELECT * FROM tbl_satuan_barang ORDER BY nama_satuan ASC");
    }
    public function create( $data, $user_id )
    {
        $this->beginTransaction();
        try {
            $sql = "INSERT INTO tbl_barang (kode_barang, nama_barang, jenis_barang, id_kategori, id_satuan, stok_umum, stok_perkara) VALUES (:kode_barang, :nama_barang, :jenis_barang, :id_kategori, :id_satuan, 0, 0)";
            $this->query($sql, [
                'kode_barang' => $data['kode_barang'],
                'nama_barang' => $data['nama_barang'],
                'jenis_barang' => $data['jenis_barang'],
                'id_kategori' => $data['id_kategori'],
                'id_satuan' => $data['id_satuan'],
            ]);
            $this->commit();
            return ['success' => TRUE, 'message' => 'Data barang berhasil ditambahkan.'];
        }
        catch (Exception $e) {
            $this->rollback();
            log_query("INSERT INTO tbl_barang", $e->getMessage());
            // Pesan error yang lebih umum untuk produksi
            $msg = 'Terjadi kesalahan pada server. Gagal menambahkan data barang.';
            return ['success' => FALSE, 'message' => $msg];
        }
    }
    public function update( $id, $data, $user_id = NULL )
    {
        $this->beginTransaction();
        try {
            $sql = "UPDATE tbl_barang SET kode_barang = :kode_barang, nama_barang = :nama_barang, jenis_barang = :jenis_barang, id_kategori = :id_kategori, id_satuan = :id_satuan WHERE id_barang = :id";
            $this->query($sql, [
                'kode_barang' => $data['kode_barang'],
                'nama_barang' => $data['nama_barang'],
                'jenis_barang' => $data['jenis_barang'],
                'id_kategori' => $data['id_kategori'],
                'id_satuan' => $data['id_satuan'],
                'id' => $id,
            ]);
            $this->commit();
            return ['success' => TRUE, 'message' => 'Data barang berhasil diperbarui.'];
        }
        catch (Exception $e) {
            $this->rollback();
            log_query("UPDATE tbl_barang", $e->getMessage());
            // Pesan error yang lebih umum untuk produksi
            $msg = 'Terjadi kesalahan pada server. Gagal memperbarui data barang.';
            return ['success' => FALSE, 'message' => $msg];
        }
    }
    public function softDelete( $id, $user_id )
    {
        $this->beginTransaction();
        try {
            $this->query("UPDATE tbl_barang SET deleted_at = NOW() WHERE id_barang = :id", ['id' => $id]);

            $this->commit();
            return ['success' => TRUE, 'message' => 'Data barang berhasil dihapus.'];
        }
        catch (Exception $e) {
            $this->rollback();
            log_query("UPDATE tbl_barang (soft delete)", $e->getMessage());
            // Pesan error yang lebih umum untuk produksi
            $msg = 'Terjadi kesalahan pada server. Gagal menghapus data barang.';
            return ['success' => FALSE, 'message' => $msg];
        }
    }
    public function getTrash()
    {
        $query = "
            SELECT b.*, k.nama_kategori, s.nama_satuan 
            FROM tbl_barang b
            LEFT JOIN tbl_kategori_barang k ON b.id_kategori = k.id_kategori
            LEFT JOIN tbl_satuan_barang s ON b.id_satuan = s.id_satuan
            WHERE b.deleted_at IS NOT NULL 
            ORDER BY b.deleted_at DESC
        ";
        return $this->fetchAll($query);
    }
    public function restore( $id, $user_id )
    {
        $this->beginTransaction();
        try {
            $this->query("UPDATE tbl_barang SET deleted_at = NULL WHERE id_barang = :id", ['id' => $id]);

            $this->commit();
            return ['success' => TRUE, 'message' => 'Data barang berhasil dipulihkan.'];
        }
        catch (Exception $e) {
            $this->rollback();
            log_query("UPDATE tbl_barang (restore)", $e->getMessage());
            // Pesan error yang lebih umum untuk produksi
            $msg = 'Terjadi kesalahan pada server. Gagal memulihkan data barang.';
            return ['success' => FALSE, 'message' => $msg];
        }
    }
}
