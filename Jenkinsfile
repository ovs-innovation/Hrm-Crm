pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {

        stage('Pull Latest Code') {
            steps {
                dir('/var/www/Hrm-Crm') {
                    sh '''
                        git config --global --add safe.directory /var/www/Hrm-Crm || true
                        git fetch origin main
                        git checkout main
                        git pull --ff-only origin main
                    '''
                }
            }
        }

        stage('Build') {
            steps {
                dir('/var/www/Hrm-Crm') {
                    sh '''
                        docker compose build backend frontend admin
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                dir('/var/www/Hrm-Crm') {
                    sh '''
                        docker compose up -d --force-recreate backend frontend admin
                    '''
                }
            }
        }

        stage('Backend Health Check') {
            steps {
                dir('/var/www/Hrm-Crm') {
                    sh '''
                        echo "Waiting for backend health check..."

                        for i in $(seq 1 12); do

                            HEALTH=$(docker inspect \
                              --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' \
                              hrm_backend)

                            echo "Attempt $i - Backend health: $HEALTH"

                            if [ "$HEALTH" = "healthy" ]; then
                                echo "Backend is healthy."
                                exit 0
                            fi

                            if [ "$HEALTH" = "unhealthy" ]; then
                                echo "Backend became unhealthy."
                                docker logs --tail 150 hrm_backend
                                exit 1
                            fi

                            sleep 5
                        done

                        echo "Backend did not become healthy in time."
                        docker logs --tail 150 hrm_backend
                        exit 1
                    '''
                }
            }
        }

        stage('Verify Containers') {
            steps {
                dir('/var/www/Hrm-Crm') {
                    sh '''
                        docker compose ps

                        docker ps --filter "name=hrm_backend" \
                                  --filter "name=hrm_frontend" \
                                  --filter "name=hrm_admin"
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'HRM CRM deployment successful.'
        }

        failure {
            echo 'HRM CRM deployment failed. Check Jenkins logs.'
        }

        always {
            sh 'docker image prune -f || true'
        }
    }
}
