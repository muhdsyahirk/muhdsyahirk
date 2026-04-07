# TryHackMe - Team (Write-Up)

_X min read · April 7, 2026 · by qs18_

---

## Entry Log

In this mini-blog, I’ll be showing you the walkthrough for [**Team**](https://tryhackme.com/room/teamcw) machine from [**TryHackMe**](https://tryhackme.com/).

- Goal: Obtain User and Root Flag
- Difficulty: Easy
- Machine Author: dalemazza

---

## Scanning for Open Ports

Machine IP: 10.48.154.138.

As usual, I started with an [**Nmap**](https://www.kali.org/tools/nmap/) scan:

```bash
nmap -T4 -p- 10.48.154.138
sudo nmap -sCV -p 21,22,80 10.48.154.138
```

![Nmap Output](./img/thm-library/Nmap-output.png)

From the scan result, I noticed that:

- SSH (port 22) is open.
- HTTP (port 80) is open and `robots.txt` is available.

As usual, I browsed the site first.

![Library: Website](./img/thm-library/web.png)

Nothing interesting here as well as in the source code.

I checked `robots.txt`:

```output
User-agent: rockyou
Disallow: /
```

I guess it's a hint to use `rockyou.txt` wordlist for password brute forcing.

There is a user named 'meliodas', I'm assuming it's the username.

---

## Futher Enumeration on the Website

Next, I used [**Gobuster**](https://www.kali.org/tools/gobuster/) to enumerate the directories.

```bash
gobuster dir -u http://10.48.154.138 -w /usr/share/wordlists/dirb/big.txt -t 100
```

![Gobuster Output](./img/thm-library/gobuster-output.png)

Nothing interesting here as well.
