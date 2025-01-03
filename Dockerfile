# Use the official Python slim image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Explicitly copy the `static` directory into the container
COPY ./static /app/static

# Copy the rest of the application files
COPY . .

# Debug: List the contents of the working directory and static folder
RUN ls -l /app
RUN ls -l /app/static || echo "Static folder is missing"

# Expose the application on port 5000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "run:app"]
