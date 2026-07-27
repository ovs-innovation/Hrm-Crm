pipeline {
    agent any

    stages {

        stage('Pull Latest Code') {
            steps {
                dir('/var/www/Hrm-Crm') {
                    sh '''
                    git config --global --add safe.directory /var/www/Hrm-Crm || true
                    git pull origin main || sudo git pull origin main
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                dir('/var/www/Hrm-Crm') {
                    sh '''
                    docker compose down || sudo docker compose down
                    docker compose up -d --build || sudo docker compose up -d --build
                    '''
                }
            }
        }
    }
}

