package org.georchestra.mapfishapp.model;

import java.sql.Connection;
import java.sql.SQLException;

import org.apache.commons.dbcp.BasicDataSource;
import org.georchestra.commons.configuration.GeorchestraConfiguration;
import org.springframework.beans.factory.annotation.Autowired;

public class ConnectionPool {

	private BasicDataSource basicDataSource;

	@Autowired
	private GeorchestraConfiguration georchestraConfiguration;

	private String jdbcUrl;

	private String jdbcDriver;

	public ConnectionPool() {
	}

	public ConnectionPool(String jdbcUrl, String jdbcDriver) {
		this.jdbcUrl = jdbcUrl;
		this.jdbcDriver = jdbcDriver;
	}

	public void init() {
		String actualJdbcUrl = jdbcUrl;

		String actualJdbcDriver = jdbcDriver;

		if (georchestraConfiguration.activated()) {
			String supersededJdbcUrl = georchestraConfiguration.getProperty("jdbcUrl");
			String supersededdriver = georchestraConfiguration.getProperty("jdbcDriver");
			
			if (supersededJdbcUrl != null) {
				actualJdbcUrl = supersededJdbcUrl;
			}

			if (supersededdriver != null) {
				actualJdbcDriver = supersededdriver;
			}
		}

		basicDataSource = new BasicDataSource();
		basicDataSource.setDriverClassName(actualJdbcDriver);
		basicDataSource.setTestOnBorrow(true);
		basicDataSource.setPoolPreparedStatements(true);
		basicDataSource.setMaxOpenPreparedStatements(-1);
		basicDataSource.setDefaultReadOnly(false);
		basicDataSource.setDefaultAutoCommit(true);

		basicDataSource.setUrl(actualJdbcUrl);
	}

	/**
	 * @param jdbcUrl
	 */
	public void setJdbcUrl(String jdbcUrl) {
		this.jdbcUrl = jdbcUrl;
	}

	/**
	 * @param jdbcdriver
	 */
	public void setJdbcDriver(String jdbcdriver) {
		this.jdbcDriver = jdbcdriver;
	}

	public Connection getConnection() throws SQLException {
		return basicDataSource.getConnection();
	}

}
