package org.georchestra.mapfishapp.repository;

import org.georchestra.mapfishapp.model.Geodocs;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * GeoDocs JpaRepositroy
 * 
 * @author pierre jégo
 *
 */
public interface GeodocsRepository extends JpaRepository<Geodocs, Long> {

	/**
	 * 
	 * @param hash
	 * @return
	 */
	int countByHash(String hash);
	
	/**
	 * 
	 * @param hash
	 * @return
	 */
	Geodocs findByHash(String hash);
}
