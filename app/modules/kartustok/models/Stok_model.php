<?php
require_once APP_PATH . '/core/Model.php';

class Stok_model extends Model {
    public function getLogByBarangId($id_barang) {
        return $this->fetchAll("SELECT * FROM tbl_log_stok WHERE id_barang = :id_barang ORDER BY tanggal_log DESC", ['id_barang' => $id_barang]);
    }
}
?>