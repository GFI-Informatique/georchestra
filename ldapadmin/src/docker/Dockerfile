FROM jetty:9.3-jre8

ENV XMS=512M XMX=1G

RUN java -jar "$JETTY_HOME/start.jar" --add-to-startd=jmx,jmx-remote,stats

ADD . /

VOLUME [ "/tmp" ]

CMD ["sh", "-c", "exec java \
-Djava.io.tmpdir=/tmp/jetty \
-Dgeorchestra.datadir=/etc/georchestra \
 -Xms$XMS -Xmx$XMX \
-XX:-UsePerfData \
-jar /usr/local/jetty/start.jar"]
