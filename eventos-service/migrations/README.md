# Migrations eventos-service

Rodar no banco MySQL (Railway ou local) quando o schema precisar ser atualizado.

## 001_add_mapa_largura_altura.sql

**Quando usar:** erro `Unknown column 'mapa_largura' in 'field list'` ao acessar GET /admin/eventos.

**Como rodar (Railway):**
1. Abra o projeto no Railway → banco MySQL → Aba "Data" ou "Query".
2. Cole e execute:
```sql
ALTER TABLE eventos ADD COLUMN mapa_largura INT DEFAULT 800;
ALTER TABLE eventos ADD COLUMN mapa_altura INT DEFAULT 600;
```

**Como rodar (local):**
```bash
mysql -u user -p database_name < migrations/001_add_mapa_largura_altura.sql
```

Se aparecer "Duplicate column name", a coluna já existe; pode ignorar.
