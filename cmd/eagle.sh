#!/bin/bash

rf=$(pwd)'/../'
eaglePath='/tmp/log/eagle/'` date +%Y/%m/`
eagleName=$eaglePath'eagle-'`date +%d`'.log'
daemonName=$eaglePath'daemon-'`date +%d`'.log'

#kill 一个后台进程会出现一段话
set +m

# 停止服务：
stopService() {
    stopEagle
    stopDaemon
}

# 停止eagle
stopEagle() {

    for proc in `ps -ef | grep node | grep eagle.js | grep -v 'grep' | awk '{print $2}'`; do
        echo $proc
        kill $proc;
    done

    for proc in `ps -ef | grep node | grep sink.js | grep -v 'grep' | awk '{print $2}'`; do
        echo $proc
        kill $proc;
    done

    if [ -f $rf'eagle2/cmd/pids' ];then
        cat $rf'eagle2/cmd/pids'|xargs kill > /dev/null
        rm -rf $rf'eagle2/cmd/pids'
        echo 'eagle已停止!'
    else
        echo 'eagle已停止!'
    fi
}

# 停止守护进程
stopDaemon() {
    for proc in `ps -ef | grep sh | grep eagle_daemon.sh | grep -v 'grep' | awk '{print $2}'`; do
        kill $proc;
    done
    echo '守护进程已停止!'
}

# 查看状态:
status() {
    for proc in `ps -ef | grep sh | grep eagle_daemon.sh | grep -v 'grep' | awk '{print $2}'`; do
        echo '守护进程 is running with pid' $proc ;
    done
    for proc in `cat $rf'eagle2/cmd/pids'`; do
        echo 'eagle is running with pid' $proc ;
    done
    echo '\n有以下几台机器活着:'
    for client in `netstat -n|grep 9527|awk '{print $5}'`;do
        echo $client
    done
}

# 启动服务：server
startService() {
    startEagle
    startDaemon
}

# 启动服务：eagle
startEagle() {

    if [ ! -d $eaglePath ];then
        mkdir -p $eaglePath
    fi

    if [ ! -f $eagleName ];then
        touch $eagleName
    fi

    cd $rf'eagle2/' && nohup /usr/local/bin/node eagle.js >> $eagleName 2>&1 &
    echo 'eagle已开启!'
}

# 启动守护进程
startDaemon() {
    if [ ! -f $daemonName ];then
        touch $daemonName
    fi

    cd $rf'eagle2/' && nohup sh cmd/eagle_daemon.sh >> $daemonName 2>&1 &
    echo '守护进程已开启!'
}

#查看日志
logShow() {
    tail -f $daemonName $eagleName
}

if [ $# -eq 0 ];then
    echo "you should pass args start|restart|-r|stop|ls|startEagle|startDaemon"
else
    case $1 in
        "stop"|"-s")
            stopService
            ;;
        "start")
            startService
            ;;
        "startEagle")
            startEagle
            ;;
        "startDaemon")
            startDaemon
            ;;
        "stopEagle")
            stopEagle
            ;;
        "restart"|"-r")
            svn up
            npm install
            stopService
            startService
            ;;
        "status")
            status
            ;;
        "-ls")
            logShow
            ;;
        "setup")
            chmod +x $(pwd)'/cmd/eagle.sh'
            chmod +x $(pwd)'/cmd/eagle_daemon.sh'
            ln -sf $(pwd)'/cmd/eagle.sh' /usr/local/bin/eagle
    esac
fi

