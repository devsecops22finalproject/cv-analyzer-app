pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out application repository...'
                checkout scm
            }
        }


        stage('Checkout Infrastructure') {
            steps {
                dir('infrastructure') {
                    git branch: 'main',
                        url: 'https://github.com/devsecops22finalproject/cv-analyzer-infra.git'
                    sh 'ls -la'
                }
            }
        }


        stage('Automated Tests') {
            steps {
                sh '''
                    docker run --rm                       -v "$WORKSPACE/backend:/app"                       -w /app                       python:3.11-slim                       sh -c "pip install -q -r requirements.txt && python -m pytest tests/ -v"
                '''
            }
        }

        stage('Verify') {
            steps {
                sh 'ls -la'
                echo 'Application repository checkout completed!'
            }
        }
    }
}
