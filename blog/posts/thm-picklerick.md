# TryHackMe - Publisher (Write-Up)

_6 min read · March 2, 2026 · by qs18_

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

It's stated there that:

- I need to logon to Rick computer.
- Rick forgot the password.

I also found the username in the page source:

```output
<!--Note to self, remember username! Username: R1ckRul3s-->
```

---

## Futher Enumeration on the Website

I used [**Gobuster**](https://www.kali.org/tools/gobuster/) to enumerate the site.

```bash
gobuster dir -u http://10.49.145.178 -w /usr/share/wordlists/seclists/Discovery/Web-Content/DirBuster-2007_directory-list-2.3-medium.txt -t 100
```

![Gobuster Output](./img/thm-picklerick/gobuster-output.png)

I accessed `robots.txt`.

```output
Wubbalubbadubdub
```

I'm assuming this as the password.

I tried logging in to SSH, but permission denied.

Then I accessed `/portal` and logged in using the retrieved credentials.

![Pickle Rick: Website /portal]()
