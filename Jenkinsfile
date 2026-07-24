pipeline {
    agent any

    stages {

        stage('Pull Latest Code') {
            steps {
                dir('/var/www/Hrm-Crm') {
                    sh 'git pull origin main'
                }
            }
        }

        stage('Deploy') {
            steps {
                dir('/var/www/Hrm-Crm') {
                    sh '''
                    docker compose down
                    docker compose up -d --build
                    '''
                }
            }
        }
    }
}

