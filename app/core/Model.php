<?php

class Model
{
    protected $db;
    protected $tableName;
    protected $primaryKey = 'id';

    public function __construct()
    {
        $this->connectDatabase();
    }

    protected function connectDatabase()
    {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";port=" . DB_PORT . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            $this->db = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log($e->getMessage());
            if (ENVIRONMENT === 'development') {
                die("Database Error: " . $e->getMessage());
            } else {
                die("Terjadi masalah koneksi database. Silakan coba lagi nanti.");
            }
        }
    }

    public function query($sql, $params = [])
    {
        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log("Database Query Error: " . $e->getMessage() . " - SQL: " . $sql);
            throw $e;
        }
    }

    public function fetchAll($sql, $params = [])
    {
        return $this->query($sql, $params)->fetchAll();
    }

    public function fetchOne($sql, $params = [])
    {
        return $this->query($sql, $params)->fetch();
    }

    public function insert($data, $table = null)
    {
        $table = $table ?: $this->tableName;
        $columns = implode(', ', array_keys($data));
        $placeholders = implode(', ', array_map(fn($k) => ":$k", array_keys($data)));

        $sql = "INSERT INTO $table ($columns) VALUES ($placeholders)";
        $this->query($sql, $data);

        return $this->db->lastInsertId();
    }

    public function update($id, $data, $table = null)
    {
        $table = $table ?: $this->tableName;
        $setClause = implode(', ', array_map(fn($k) => "$k = :$k", array_keys($data)));
        $data['id_param'] = $id;

        $sql = "UPDATE $table SET $setClause WHERE {$this->primaryKey} = :id_param";
        $this->query($sql, $data);

        return true;
    }

    public function delete($id, $table = null)
    {
        $table = $table ?: $this->tableName;
        $sql = "UPDATE $table SET deleted_at = NOW() WHERE {$this->primaryKey} = :id";
        $this->query($sql, ['id' => $id]);

        return true;
    }

    public function beginTransaction()
    {
        $this->db->beginTransaction();
    }

    public function commit()
    {
        $this->db->commit();
    }

    public function rollback()
    {
        $this->db->rollback();
    }
}
