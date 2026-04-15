<?php

require_once APP_PATH . '/core/Model.php';

class Notifikasi_model extends Model
{

    public function getUnreadNotifications($user_id)
    {
        $sql = "
        SELECT id_notifikasi, pesan, tautan, created_at 
        FROM tbl_notifikasi 
        WHERE id_pengguna_tujuan = :user_id AND sudah_dibaca = 0
        ORDER BY created_at DESC
        LIMIT 10
    ";
        return $this->fetchAll($sql, ['user_id' => $user_id]);
    }

    public function markAsRead($user_id, $notif_id = NULL)
    {
        // Jika notif_id diberikan, tandai satu notifikasi.
        // Jika tidak, tandai semua notifikasi milik pengguna.
        if ($notif_id)
        {
            $this->query("UPDATE tbl_notifikasi SET sudah_dibaca = 1 WHERE id_notifikasi = :notif_id AND id_pengguna_tujuan = :user_id AND sudah_dibaca = 0", [
                'notif_id' => $notif_id,
                'user_id' => $user_id
            ]);
        } else
        {
            $this->query("UPDATE tbl_notifikasi SET sudah_dibaca = 1 WHERE id_pengguna_tujuan = :user_id AND sudah_dibaca = 0", [
                'user_id' => $user_id
            ]);
        }
        try
        {
            return [ 'success' => TRUE ];
        } catch (Exception $e)
        {
            return [ 'success' => FALSE, 'message' => 'Gagal menandai notifikasi.' ];
        }
    }

}