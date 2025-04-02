name: LINE Album Backup

on:
  schedule:
    - cron: '0 0 * * *'  # 每天午夜執行
  workflow_dispatch:     # 允許手動觸發

jobs:
  backup:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3
        
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
          
      - name: Install dependencies
        run: |
          npm install axios
          npm install googleapis
          npm install @line/bot-sdk
          
      - name: Run backup script
        run: node backup-script.js
        env:
          LINE_CHANNEL_ID: ${{ secrets.LINE_CHANNEL_ID }}
          LINE_CHANNEL_SECRET: ${{ secrets.LINE_CHANNEL_SECRET }}
          LINE_ACCESS_TOKEN: ${{ secrets.LINE_ACCESS_TOKEN }}
          GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
          GOOGLE_CLIENT_SECRET: ${{ secrets.GOOGLE_CLIENT_SECRET }}
          GOOGLE_API_KEY: ${{ secrets.GOOGLE_API_KEY }}
          GOOGLE_REFRESH_TOKEN: ${{ secrets.GOOGLE_REFRESH_TOKEN }}
