<?php

require_once APP_PATH . '/core/Model.php';

class Hakakses_model extends Model
{

    public function getAllRoles()
    {
        return $this->fetchAll("SELECT * FROM tbl_roles ORDER BY nama_role");
    }

    public function getPermissionsByRole($id_role)
    {
        $sql = "
            SELECT 
                p.id_permission, p.nama_permission, p.deskripsi_permission, p.grup,
                (CASE WHEN rp.id_role IS NOT NULL THEN 1 ELSE 0 END) as diizinkan
            FROM tbl_permissions p
            LEFT JOIN tbl_role_permissions rp ON p.id_permission = rp.id_permission AND rp.id_role = :id_role
            ORDER BY p.grup, p.nama_permission
        ";
        $result = $this->fetchAll($sql, ['id_role' => $id_role]);

        // Kelompokkan berdasarkan grup
        $grouped = [];
        foreach ($result as $row)
        {
            $grouped[$row['grup']][] = $row;
        }

        return $grouped;
    }

    public function updateRolePermissions($id_role, $permission_ids)
    {

        if (empty($id_role))
        {
            return [ 'success' => FALSE, 'message' => 'Role tidak valid.' ];
        }

        $this->db->begin_transaction();
        try
        {
            // 1. Hapus semua permission lama untuk role ini
            $this->query("DELETE FROM tbl_role_permissions WHERE id_role = :id_role", ['id_role' => $id_role]);

            // 2. Masukkan permission baru yang dipilih
            if (!empty($permission_ids))
            {
                foreach ($permission_ids as $id_permission)
                {
                    $this->query("INSERT INTO tbl_role_permissions (id_role, id_permission) VALUES (:id_role, :id_permission)", [
                        'id_role' => $id_role,
                        'id_permission' => $id_permission
                    ]);
                }
            }

            $this->db->commit();
        } catch (Exception $e)
        {
            $this->db->rollback();
            log_query("Update Hak Akses", $e->getMessage());
            $msg = (ENVIRONMENT === 'development') ? $e->getMessage() : 'Gagal memperbarui hak akses.';
            return [ 'success' => FALSE, 'message' => $msg ];
        }
    }

}