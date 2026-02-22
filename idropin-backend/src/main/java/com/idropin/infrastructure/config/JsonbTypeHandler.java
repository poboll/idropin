package com.idropin.infrastructure.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.idropin.domain.vo.AiEvaluationResult;
import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;
import org.apache.ibatis.type.MappedTypes;
import org.postgresql.util.PGobject;

import java.sql.*;

/**
 * PostgreSQL JSONB 类型处理器，在 AiEvaluationResult 与 jsonb 列之间转换。
 */
@MappedTypes(AiEvaluationResult.class)
public class JsonbTypeHandler extends BaseTypeHandler<AiEvaluationResult> {

    private static final ObjectMapper MAPPER = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, AiEvaluationResult parameter, JdbcType jdbcType)
            throws SQLException {
        PGobject pg = new PGobject();
        pg.setType("jsonb");
        try {
            pg.setValue(MAPPER.writeValueAsString(parameter));
        } catch (Exception e) {
            throw new SQLException("Failed to serialize AiEvaluationResult to JSON", e);
        }
        ps.setObject(i, pg);
    }

    @Override
    public AiEvaluationResult getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return parse(rs.getString(columnName));
    }

    @Override
    public AiEvaluationResult getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return parse(rs.getString(columnIndex));
    }

    @Override
    public AiEvaluationResult getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return parse(cs.getString(columnIndex));
    }

    private AiEvaluationResult parse(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return MAPPER.readValue(json, AiEvaluationResult.class);
        } catch (Exception e) {
            return null;
        }
    }
}
