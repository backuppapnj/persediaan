<?php

require_once APP_PATH . '/core/Model.php';

class Pengguna_model extends Model
{

    public function getAllUsers()
    {

        $query = "
            SELECT p.id_pengguna, p.username, p.nama_lengkap, p.is_active, r.nama_role, b.nama_bagian
            FROM tbl_pengguna p
            LEFT JOIN tbl_roles r ON p.id_role = r.id_role
            LEFT JOIN tbl_bagian b ON p.id_bagian = b.id_bagian
            ORDER BY p.nama_lengkap ASC
        ";

        return $this->fetchAll($query);
    }

    public function getUserById($id)
    {

        return $this->fetchOne("SELECT id_pengguna, username, nama_lengkap, id_role, id_bagian, is_active FROM tbl_pengguna WHERE id_pengguna = :id_pengguna", ['id_pengguna' => $id]);
    }

    public function getAllRoles()
    {

        return $this->fetchAll("SELECT id_role, nama_role FROM tbl_roles ORDER BY nama_role");
    }

    public function getAllBagian()
    {

        return $this->fetchAll("SELECT id_bagian, nama_bagian FROM tbl_bagian ORDER BY nama_bagian");
    }

    public function createUser($data)
    {

        // Validasi
        if (empty($data['username']) || empty($data['nama_lengkap']) || empty($data['password']) || empty($data['id_role']) || empty($data['id_bagian']))
        {
            return [ 'success' => FALSE, 'message' => 'Semua field wajib diisi.' ];
        }

        $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);
        $is_active     = isset($data['is_active']) ? 1 : 0;

        try
        {
            $this->query(
                "INSERT INTO tbl_pengguna (username, nama_lengkap, password, id_role, id_bagian, is_active) VALUES (:username, :nama_lengkap, :password, :id_role, :id_bagian, :is_active)",
                [
                    'username' => $data['username'],
                    'nama_lengkap' => $data['nama_lengkap'],
                    'password' => $password_hash,
                    'id_role' => $data['id_role'],
                    'id_bagian' => $data['id_bagian'],
                    'is_active' => $is_active,
                ]
            );
            return [ 'success' => TRUE, 'message' => 'Pengguna berhasil ditambahkan.' ];
        } catch (Exception $e)
        {
            log_query("INSERT user", $e->getMessage());
            return [ 'success' => FALSE, 'message' => (ENVIRONMENT === 'development') ? $e->getMessage() : 'Gagal menambahkan pengguna. Username mungkin sudah ada.' ];
        }
    }

    public function updateUser($id, $data)
    {

        // Validasi
        if (empty($id) || empty($data['username']) || empty($data['nama_lengkap']) || empty($data['id_role']) || empty($data['id_bagian']))
        {
            return [ 'success' => FALSE, 'message' => 'Semua field wajib diisi.' ];
        }

        $is_active = isset($data['is_active']) ? 1 : 0;

        try
        {
            if (!empty($data['password']))
            {
                // Jika password diisi, update password
                $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);
                $this->query(
                    "UPDATE tbl_pengguna SET username=:username, nama_lengkap=:nama_lengkap, password=:password, id_role=:id_role, id_bagian=:id_bagian, is_active=:is_active WHERE id_pengguna=:id_pengguna",
                    [
                        'username' => $data['username'],
                        'nama_lengkap' => $data['nama_lengkap'],
                        'password' => $password_hash,
                        'id_role' => $data['id_role'],
                        'id_bagian' => $data['id_bagian'],
                        'is_active' => $is_active,
                        'id_pengguna' => $id,
                    ]
                );
            } else
            {
                // Jika password kosong, jangan update password
                $this->query(
                    "UPDATE tbl_pengguna SET username=:username, nama_lengkap=:nama_lengkap, id_role=:id_role, id_bagian=:id_bagian, is_active=:is_active WHERE id_pengguna=:id_pengguna",
                    [
                        'username' => $data['username'],
                        'nama_lengkap' => $data['nama_lengkap'],
                        'id_role' => $data['id_role'],
                        'id_bagian' => $data['id_bagian'],
                        'is_active' => $is_active,
                        'id_pengguna' => $id,
                    ]
                );
            }
            return [ 'success' => TRUE, 'message' => 'Pengguna berhasil diperbarui.' ];
        } catch (Exception $e)
        {
            log_query("UPDATE user", $e->getMessage());
            return [ 'success' => FALSE, 'message' => (ENVIRONMENT === 'development') ? $e->getMessage() : 'Gagal memperbarui pengguna. Username mungkin sudah ada.' ];
        }
    }

    public function deleteUser($id)
    {

        if (empty($id))
        {
            return [ 'success' => FALSE, 'message' => 'ID pengguna tidak valid.' ];
        }

        try
        {
            $this->query("DELETE FROM tbl_pengguna WHERE id_pengguna = :id_pengguna", ['id_pengguna' => $id]);
            return [ 'success' => TRUE, 'message' => 'Pengguna berhasil dihapus.' ];
        } catch (Exception $e)
        {
            log_query("DELETE user", $e->getMessage());
            return [ 'success' => FALSE, 'message' => (ENVIRONMENT === 'development') ? $e->getMessage() : 'Gagal menghapus pengguna.' ];
        }
    }

}
