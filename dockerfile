FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Set default env variables (can be overridden)
ENV PORT=8080

# Expose port for health checks
EXPOSE 8080

# Run the bot
CMD ["python", "bot.py"]