Check the firewall logs to determine the source that is being blocked:

`less /var/log/syslog`

Save the current iptable rules to file:

`sudo iptables-save > iptable-rules-221022.bk`

Copy the file to modify:

`cp iptable-rules-221022.bk mod-iptable-rules-221022.bk`

Add the following rule to file:

`-A INPUT -i <blocked-source-name> -j ACCEPT`

look for this rule: `-A INPUT -i br-19991932f479 -j ACCEPT` in the file and paste it above it.

Restore the iptable rules, and make sure it works:

`iptables-restore < mod-iptable-rules-221022.bk`

Save the rules permanently:

`sudo iptables-save | sudo tee /etc/iptables/rules.v4`
