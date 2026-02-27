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

I used [**FFuF**]() to enumerate the site.

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

![Publisher: Website /spip]()

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

After accessing the directories, I found out that `/ecrire` is a login page, and I also found that it is using **SPIP version 4.2.0**.

I then searched for an exploit for this version and I found [SPIP v4.2.0 - Remote Code Execution (Unauthenticated)](https://www.exploit-db.com/exploits/51536) from Exploit-DB.
