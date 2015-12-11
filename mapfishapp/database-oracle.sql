-- geOrchestra 
-- Script database installation Oracle 11G Georchestra since 15.12 version

-- Mapfishapp 
CREATE USER mapfishapp IDENTIFIED BY georchestradb default tablespace TS_DATA temporary tablespace TS_TEMP;
GRANT ALL PRIVILEGES TO mapfishapp;

create table mapfishapp.geodocs (
  id NUMBER(20) primary key, -- 1 to 9223372036854775807 (~ 1E19)
  username varchar(200), -- can be NULL (eg: anonymous user)
  standard varchar(3) not null, -- eg: CSV, KML, SLD, WMC, GML
  raw_file_content CLOB not null, -- file content
  file_hash varchar(32) unique not null, -- md5sum
  created_at timestamp default  CURRENT_TIMESTAMP, -- creation date
  last_access timestamp , -- last access date
  access_count integer default 0 -- access count, defaults to 0
);
  
CREATE SEQUENCE mapfishapp.geodocsid;

CREATE OR REPLACE TRIGGER mapfishapp.geodocstrig 
BEFORE INSERT ON  mapfishapp.geodocs 
FOR EACH ROW

BEGIN
  SELECT mapfishapp.geodocsid.NEXTVAL
  INTO   :new.id
  FROM   dual;
END;
/

create index geodocs_file_hash on mapfishapp.geodocs (file_hash);
create index geodocs_username on mapfishapp.geodocs (username);
create index geodocs_standard on mapfishapp.geodocs (standard);
create index geodocs_created_at on mapfishapp.geodocs (created_at);
create index geodocs_last_access on mapfishapp.geodocs (last_access);
create index geodocs_access_count on mapfishapp.geodocs (access_count);
create index geodocs_access_count on mapfishapp.geodocs using btree(access_count);

-- GeoNetwork 
CREATE USER geonetwork IDENTIFIED BY georchestradb default tablespace TS_DATA temporary tablespace TS_TEMP;;
--GRANT ALL PRIVILEGES ON SCHEMA geonetwork TO geonetwork;
GRANT ALL PRIVILEGES TO geonetwork;


-- Ldapadmin
--
-- PostgreSQL database
--
CREATE USER ldapadmin IDENTIFIED BY georchestradb default tablespace TS_DATA temporary tablespace TS_TEMP;

--SET search_path TO ldapadmin,public,pg_catalog;
CREATE TABLE ldapadmin.user_token (
    "uid" VARCHAR2(50) NOT NULL primary key,
    token VARCHAR2(50),
    creation_date timestamp with time zone
);
 GRANT ALL PRIVILEGES to ldapadmin;
 
--OGC Statistics
CREATE USER ogcstatistics IDENTIFIED BY georchestradb default tablespace TS_DATA temporary tablespace TS_TEMP;

--ET search_path TO ogcstatistics,public,pg_catalog;
CREATE TABLE ogc_services_log (
  user_name varchar2(255),
  "date" date,
  service varchar2(5),
  layer varchar2(255),
  id numeric(19,0) NOT NULL,
  request varchar2(20),
  org varchar2(255),
  CONSTRAINT primary_key PRIMARY KEY (id )
);

CREATE INDEX user_name_index ON ogc_services_log  (user_name);
CREATE INDEX date_index ON ogc_services_log  (date);
CREATE INDEX service_index ON ogc_services_log(service);
CREATE INDEX layer_index ON ogc_services_log  (layer);
 
GRANT ALL PRIVILEGES to  ogcstatistics;
