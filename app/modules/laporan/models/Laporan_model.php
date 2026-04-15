<?php

require_once APP_PATH . '/core/Model.php';

class Laporan_model extends Model
{

    public function getAllStock()
    {

        $query = "
            SELECT 
                b.kode_barang,
                b.nama_barang,
                k.nama_kategori,
                s.nama_satuan,
                b.stok_umum,
                b.stok_perkara,
                (b.stok_umum + b.stok_perkara) as stok_total
            FROM tbl_barang b
            LEFT JOIN tbl_kategori_barang k ON b.id_kategori = k.id_kategori
            LEFT JOIN tbl_satuan_barang s ON b.id_satuan = s.id_satuan
            WHERE b.deleted_at IS NULL
            ORDER BY b.nama_barang ASC
        ";

        return $this->fetchAll($query);
    }

    public function getStockCard($id_barang)
    {

        if (empty($id_barang))
        {
            return [];
        }
        $query = "
            SELECT l.*, u.nama_lengkap as nama_pengguna
            FROM tbl_log_stok l
            LEFT JOIN tbl_pengguna u ON l.id_pengguna_aksi = u.id_pengguna
            WHERE l.id_barang = :id_barang
            ORDER BY l.tanggal_log DESC
        ";
        return $this->fetchAll($query, ['id_barang' => $id_barang]);
    }

    private function applyDateFilter($query, $filters)
    {

        $params = [];
        if (!empty($filters['start_date']))
        {
            $query .= " AND p.tanggal_permintaan >= :start_date";
            $params['start_date'] = $filters['start_date'];
        }
        if (!empty($filters['end_date']))
        {
            $query .= " AND p.tanggal_permintaan <= :end_date";
            $params['end_date'] = $filters['end_date'];
        }
        return [ 'query' => $query, 'params' => $params, 'types' => '' ];
    }

    public function getPermintaanReport($filters)
    {

        $query = "SELECT * FROM v_permintaan_lengkap p WHERE 1=1";
        $params = [];

        if (!empty($filters['status']) && $filters['status'] !== 'semua')
        {
            $query .= " AND p.status_permintaan = :status";
            $params['status'] = $filters['status'];
        }

        $dateFilter = $this->applyDateFilter($query, $filters);
        $query      = $dateFilter['query'];
        $params     = array_merge($params, $dateFilter['params']);

        $query .= " ORDER BY p.tanggal_permintaan DESC";

        return $this->fetchAll($query, $params);
    }

    public function getPembelianReport($filters)
    {

        $query = "SELECT * FROM v_permintaan_lengkap p WHERE p.tipe_permintaan = 'pembelian'";
        $params = [];

        if (!empty($filters['status']) && $filters['status'] !== 'semua')
        {
            $query .= " AND p.status_permintaan = :status";
            $params['status'] = $filters['status'];
        }

        $dateFilter = $this->applyDateFilter($query, $filters);
        $query      = $dateFilter['query'];
        $params     = array_merge($params, $dateFilter['params']);

        $query .= " ORDER BY p.tanggal_permintaan DESC";

        return $this->fetchAll($query, $params);
    }

}
