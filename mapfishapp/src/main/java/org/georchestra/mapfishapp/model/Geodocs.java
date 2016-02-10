package org.georchestra.mapfishapp.model;

import java.io.Serializable;
import java.util.Date;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Lob;
import javax.persistence.Table;

@Entity
@Table(name="geodocs")
public class Geodocs implements Serializable{

	/**
	 * Default constructor
	 */
	public Geodocs() {
		super();
	}

	/**
	 * 
	 * @param username
	 * @param standard
	 * @param raw_file_content
	 * @param file_hash
	 */
	public Geodocs(String username, String standard, String raw_file_content, String file_hash) {
		super();
		this.username = username;
		this.standard = standard;
		this.content = raw_file_content;
		this.hash = file_hash;
	}

	/**
	 * Add generated serialId
	 */
	private static final long serialVersionUID = -678942239746012227L;
	
	@Id
	@GeneratedValue
	@Column(name="id")
	private long id;
	
	@Column(name="username")
	private String username;
	
	@Column(name="standard", nullable = false, length = 3)
	private String standard;
	
	@Lob
	@Column(name="raw_file_content", nullable = false)
	private String content;
	
	@Column(name="file_hash", nullable = false, length = 32)
	private String hash;
	
	@Column(name="created_at")
	private Date createdAt = new Date();
	
	@Column(name="last_access")
	private Date lastAccess;
	
	@Column(name="access_count")
	private int accessCount = 0;

	public String getRawFileContent() {
		return content;
	}

	public void setRawFileContent(String rawFileContent) {
		this.content = rawFileContent;
	}

	public Date getLastAccess() {
		return lastAccess;
	}

	public void setLastAccess(Date lastAccess) {
		this.lastAccess = lastAccess;
	}

	public int getAccessCount() {
		return accessCount;
	}

	public void setAccessCount(int accessCount) {
		this.accessCount = accessCount;
	}

}
