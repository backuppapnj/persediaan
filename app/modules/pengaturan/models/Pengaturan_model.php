<?php

require_once APP_PATH . '/core/Model.php';

class Pengaturan_model extends Model
{

    public function getAllSettings()
    {
        return $this->fetchAll("SELECT * FROM tbl_pengaturan ORDER BY id_pengaturan ASC");
    }

    public function getSetting($key)
    {
        $result = $this->fetchOne("SELECT pengaturan_value FROM tbl_pengaturan WHERE pengaturan_key = :key", ['key' => $key]);
        return $result['pengaturan_value'] ?? '';
    }

    public function saveSettings($settings)
    {

        if (empty($settings) || !is_array($settings))
        {
            return [ 'success' => FALSE, 'message' => 'Tidak ada data pengaturan yang dikirim.' ];
        }

        $this->db->begin_transaction();
        try
        {
            foreach ($settings as $key => $value)
            {
                $this->query("UPDATE tbl_pengaturan SET pengaturan_value = :value WHERE pengaturan_key = :key", [
                    'value' => $value,
                    'key' => $key
                ]);
            }
            $this->db->commit();
        } catch (Exception $e)
        {
            $this->db->rollback();
            log_query("Save Settings", $e->getMessage());
            $msg = (ENVIRONMENT === 'development') ? $e->getMessage() : 'Gagal menyimpan pengaturan.';
            return [ 'success' => FALSE, 'message' => $msg ];
        }
    }

    public function clearAllTransactions()
    {

        $tables_to_truncate = [
            'tbl_log_stok',
            'tbl_barang_keluar',
            'tbl_detail_barang_masuk',
            'tbl_barang_masuk',
            'tbl_detail_permintaan_atk',
            'tbl_permintaan_atk',
            'tbl_detail_stock_opname',
            'tbl_stock_opname',
        ];

        $this->db->begin_transaction();
        try
        {
            $this->db->query("SET FOREIGN_KEY_CHECKS=0;");

            foreach ($tables_to_truncate as $table)
            {
                $this->db->query("TRUNCATE TABLE {$table}");
            }

            $this->db->query("UPDATE tbl_barang SET stok_umum = 0, stok_perkara = 0");

            $this->db->query("SET FOREIGN_KEY_CHECKS=1;");

            $this->db->commit();

            return [ 'success' => TRUE, 'message' => 'Semua data transaksi berhasil dihapus dan stok telah di-reset.' ];
        } catch (Exception $e)
        {
            $this->db->rollback();
            log_query("Clear Transactions", $e->getMessage());
            $msg = (ENVIRONMENT === 'development') ? $e->getMessage() : 'Gagal menghapus data transaksi.';
            return [ 'success' => FALSE, 'message' => $msg ];
        }
    }

}