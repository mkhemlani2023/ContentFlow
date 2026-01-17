# GitHub Secrets Setup Checklist

## Your Siteground Credentials

From the SSH key you just created:

```
Hostname: ssh.gutandbody.com
Username: u2060-x69iucjh4gxy
Port: 18765
Key Name: contentflow-automation-master
```

---

## Step-by-Step Setup

### 1. Get Your SSH Private Key

1. Go to Siteground → **Site Tools** → **Dev** → **SSH Keys Manager**
2. Find key: `contentflow-automation-master`
3. Click **View** or **Download**
4. Copy the **entire contents** (including `-----BEGIN` and `-----END` lines)

### 2. Get Your MySQL Credentials

1. In Siteground → **Site Tools** → **MySQL** → **MySQL Manager**
2. Look for your MySQL username (usually same as SSH: `u2060-x69iucjh4gxy`)
3. Note your MySQL password

If you don't see it:
- Click **Create Database** → Note the credentials
- Or use **phpMyAdmin** → Your login there is your MySQL credentials

### 3. Add Secrets to GitHub

Go to: **https://github.com/mkhemlani2023/ContentFlow/settings/secrets/actions**

Click **"New repository secret"** and add each of these:

#### Secret 1: SSH Private Key
```
Name: SITEGROUND_SSH_KEY
Value: [Paste entire private key]
```

Example value (yours will be different):
```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA1234567890abcdef...
[many lines]
...1234567890abcdef
-----END RSA PRIVATE KEY-----
```

#### Secret 2: SSH Hostname
```
Name: SITEGROUND_HOST
Value: ssh.gutandbody.com
```

#### Secret 3: SSH Username
```
Name: SITEGROUND_USER
Value: u2060-x69iucjh4gxy
```

#### Secret 4: SSH Port
```
Name: SITEGROUND_SSH_PORT
Value: 18765
```

#### Secret 5: MySQL Username
```
Name: SITEGROUND_DB_USER
Value: [Your MySQL username - usually same as SSH]
```

#### Secret 6: MySQL Password
```
Name: SITEGROUND_DB_PASS
Value: [Your MySQL password]
```

---

## Verify Secrets Are Added

After adding all 6 secrets, you should see them listed (values are hidden):

```
✓ SITEGROUND_SSH_KEY
✓ SITEGROUND_HOST
✓ SITEGROUND_USER
✓ SITEGROUND_SSH_PORT
✓ SITEGROUND_DB_USER
✓ SITEGROUND_DB_PASS
```

---

## Test the Setup

Once secrets are added, we can test the workflow:

### Option 1: Manual Test (Recommended First)
1. Go to **Actions** tab in GitHub
2. Click **Deploy WordPress Site to Siteground**
3. Click **Run workflow**
4. Enter test values:
   - Domain: `test-site.gutandbody.com`
   - Niche: `health`
   - Site title: `Health Test Site`
   - Admin email: `your-email@example.com`
   - Theme: `generatepress`
   - Content count: `5`
5. Click **Run workflow**
6. Watch the logs to see if it works!

### Option 2: Automated via ContentFlow App (After test works)
Once manual test succeeds, we'll connect ContentFlow to trigger this automatically.

---

## Troubleshooting

### Can't Find MySQL Credentials?

Try this:
1. SSH into Siteground:
   ```bash
   ssh -p 18765 u2060-x69iucjh4gxy@ssh.gutandbody.com
   ```
2. Run:
   ```bash
   cat ~/.my.cnf
   ```
   This might show your MySQL password

Or create a new database user:
1. Site Tools → MySQL → Database
2. Create new user with known password
3. Use those credentials in GitHub Secrets

### SSH Key Not Working?

Make sure you copied:
- The **PRIVATE** key (begins with `-----BEGIN RSA PRIVATE KEY-----`)
- NOT the public key (ends with `.pub`)
- All lines including BEGIN and END markers
- No extra spaces or line breaks

---

## Next Steps

After secrets are configured:

1. ✅ Test manual workflow run
2. ✅ Verify WordPress installs successfully
3. ✅ Create API endpoint in ContentFlow to trigger workflow
4. ✅ Connect "Create Blog" button to automation

Then every new site will deploy in ~8 minutes! 🚀
