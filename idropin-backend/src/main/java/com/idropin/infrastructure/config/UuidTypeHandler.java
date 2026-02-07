package com.idropin.infrastructure.config;

import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;

import java.sql.*;
import java.util.UUID;

/**
 * UUID 类型处理器 - 处理 PostgreSQL UUID 类型
 * 不使用 @MappedTypes 注解，避免全局应用
 *
 * @author Idrop.in Team
 */
public class UuidTypeHandler extends BaseTypeHandler<String> {

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, String parameter, JdbcType jdbcType) throws SQLException {
        ps.setString(i, parameter);
    }

    @Override
    public String getNullableResult(ResultSet rs, String columnName) throws SQLException {
        Object uuid = rs.getObject(columnName);
        return uuid != null ? uuid.toString() : null;
    }

    @Override
    public String getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        Object uuid = rs.getObject(columnIndex);
        return uuid != null ? uuid.toString() : null;
    }

    @Override
    public String getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        Object uuid = cs.getObject(columnIndex);
        return uuid != null ? uuid.toString() : null;
    }
}
