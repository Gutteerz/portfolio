# Use the official Python slim image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Explicitly copy the `static` directory and its contents
COPY ./app/static /app/static

# Copy the rest of the application files
COPY . .

# Debugging step: List contents of the /app directory
RUN ls -l /app && ls -l /app/static

# Expose the application on port 5000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "run:app"]
