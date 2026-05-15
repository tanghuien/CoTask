//viewTask
import React, { useState, useEffect } from 'react';
import { View, Switch, StyleSheet, ScrollView, Text, LogBox, Modal, Alert, TouchableOpacity, Pressable } from 'react-native';
import { openDatabase } from 'react-native-sqlite-storage';
import dayjs from 'dayjs';
import Icon from 'react-native-vector-icons/Octicons';
import notifee, { TimestampTrigger, TriggerType } from '@notifee/react-native';
import FileViewer from "react-native-file-viewer";
import EditTask from './editTask';
import DateTimePicker, { useDefaultStyles } from 'react-native-ui-datepicker';

var db = openDatabase({ name: 'database.db' });

const ViewTask = ({ route, navigation }) => {
    const defaultStyles = useDefaultStyles();

    const [task, setTask] = useState([]);
    const [reminderIsEnabled, setReminderIsEnabled] = useState(false);
    const [reminder_picker_isVisible, setReminder_picker_IsVisible] = useState(false);
    const [reminder_datetime, setReminderDateTime] = useState(dayjs().add(10, "minutes"));
    const [cancelReminder, setCancelReminder] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    var isSameOrAfter = require("dayjs/plugin/isSameOrAfter");
    dayjs.extend(isSameOrAfter);

    const refreshData = async () => {
        LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

        // in case, async storage limitation
        // await AsyncStorage.clear();
        try {
            const taskData = await getTaskFromDB();
            setTask(taskData);
        } catch (error) {
            console.error('Error refreshing data at home page:', error);
        }
    };


    const getTaskFromDB = async () => {
        return new Promise((resolve, reject) => {
            db.transaction((tx) => {
                tx.executeSql('SELECT * FROM Tasks WHERE task_id = ?', [route.params.task_id], (tx, results) => {
                    const taskData = results.rows.item(0);
                    resolve(taskData);
                }, (error) => {
                    reject(error);
                });
            });
        });
    };

    const onCreateTriggerNotification = async (datetime) => {
        const trigger = {
            trigger: TimestampTrigger,
            type: TriggerType.TIMESTAMP,
            timestamp: dayjs(datetime).valueOf(),
        };

        await notifee.createTriggerNotification(
            {
                title: task.task_title,
                body: "Due date: " + dayjs(task.due_date).format('D MMMM YYYY'),
            },
            trigger,
        );

    };

    const reminderToogleSwitch = () => {
        setReminderIsEnabled(previousState => !previousState);
        if (reminderIsEnabled) {
            setReminder_picker_IsVisible(false);
        }
    };

    const selectReminder = (datetime) => {
        setReminderDateTime(datetime);
        if (dayjs().isSameOrAfter(dayjs(datetime))) {
            setCancelReminder(true);
        }
        else {
            setCancelReminder(false);
        }


        db.transaction((tx) => {
            tx.executeSql(
                'UPDATE Tasks set reminder_datetime=? where task_id=?',
                [datetime, route.params.task_id],
            )
        });
    };

    const saveReminder = () => {
        db.transaction((tx) => {
            tx.executeSql(
                'UPDATE Tasks set reminder=?, reminder_datetime=? where task_id=?',
                [reminderIsEnabled, reminder_datetime, route.params.task_id],
            )
        });

        if (reminderIsEnabled && dayjs(reminder_datetime).isAfter(dayjs())) {
            onCreateTriggerNotification(reminder_datetime);
        }
    };

    const deleteTask = (task_id) => {
        db.transaction((tx) => {
            tx.executeSql(
                'DELETE FROM Tasks WHERE task_id=?', [task_id]
            );
        });
        navigation.navigate('HomeScreen');
    };

    useEffect(() => {
        navigation.addListener('focus', refreshData);

        if (task) {
            setReminderDateTime(task.reminder_datetime);
            if (dayjs().isSameOrAfter(dayjs(task.reminder_datetime))) {
                setCancelReminder(true);
            }
            else {
                setCancelReminder(false);
            }

            if (task.reminder === 1) {
                setReminderIsEnabled(true);
            }
        }

    }, [task]);

    return (
        <View style={styles.container}>
            <ScrollView keyboardShouldPersistTaps="handled">
                <View>
                    {task.completed == false ?
                        (<Pressable onPress={() => setModalVisible(true)}>
                            <Text numberOfLines={1} style={styles.editText}><Icon name="pencil" size={13} color={"black"} /> Edit</Text>
                        </Pressable>) :
                        <Text></Text>
                    }

                    {task.updated_date != null ?
                     <Text style={styles.grayText}>Edited on {dayjs(task.updated_date).format("D MMMM YYYY")}</Text> :
                     <Text></Text>}
                    <Text style={styles.title}>{task.task_title}</Text>
                    <Text style={styles.grayText}>On {dayjs(task.due_date).format("D MMMM YYYY")}</Text>
                    {task.repeat == 1 && <Text style={styles.grayText}>repeats {task.repeat_frequency}</Text>}


                    <Text style={styles.text}>Priority level: {task.priority_level}</Text>

                    <View>
                        <View>
                            <View style={styles.first_row}>
                                <Text style={styles.labelText}>Reminder: </Text>
                                <Switch
                                    trackColor={{ false: '#E9ECEF', true: '#A2CFFE' }}
                                    thumbColor={"white"}
                                    ios_backgroundColor="#E9ECEF"
                                    onValueChange={reminderToogleSwitch}
                                    value={reminderIsEnabled}
                                    style={styles.toggleSwitch}
                                />
                            </View>

                            {reminderIsEnabled &&
                                <View style={styles.row_with_borderTop}>
                                    <Text style={styles.labelText}>Date and Time: </Text>
                                    <Pressable style={styles.datetimepickerText} onPress={() => setReminder_picker_IsVisible(!reminder_picker_isVisible)}>
                                        <Text style={{ textDecorationLine: cancelReminder ? "line-through" : "none" }}>{dayjs(reminder_datetime).format('DD MMM YYYY h:mmA')}</Text>
                                    </Pressable>
                                </View>
                            }

                            <View style={styles.date_time_picker}>
                                {reminder_picker_isVisible && <DateTimePicker
                                    mode="single"
                                    date={reminder_datetime}
                                    timePicker={true}
                                    weekdaysFormat = "short"
                                    styles={{
                                        ...defaultStyles,
                                        today: { borderColor: "#64ADF9", borderRadius: 50, borderWidth: 1 }, 
                                        today_label: { color: "#64ADF9" },
                                        selected: { backgroundColor: "#64ADF9", borderRadius: 50 }, 
                                        selected_label: { color: 'white' }, 
                                    }}
                                    onChange={(params) => selectReminder(params.date)}
                                />}
                            </View>
                        </View>

                    </View>

                    <Pressable style={styles.saveButton} onPress={() => saveReminder()}>
                        <Text style={styles.saveButtonText}>Save</Text>
                    </Pressable>

                    <Text style={styles.label}>Notes:</Text>

                    <Text style={styles.notes}>{task.task_note}</Text>

                    <Text style={styles.label}>Attachment:</Text>
                    {task.attachment_name ?
                        (<Pressable onPress={() => FileViewer.open(task.attachment_path)}>
                            <Text numberOfLines={1} style={styles.text}><Icon name="file" size={13} color={"black"} /> {task.attachment_name}</Text>
                        </Pressable>) :
                        <Text numberOfLines={1} style={styles.text}>No file is selected</Text>
                    }

                    <Pressable onPress={() => deleteTask(route.params.task_id)}>
                        <Text numberOfLines={1} style={[styles.text, { color: "red" }]}><Icon name="trash" size={13} color={"red"} /> Delete</Text>
                    </Pressable>
                </View>

                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => {
                        Alert.alert('Modal has been closed.');
                        setModalVisible(!modalVisible);
                    }}>
                    <View style={styles.modalView}>
                        <View style={styles.topView}>
                            <View style={styles.topLeftView} >
                                <Text />
                            </View>
                            <View style={styles.topCenterView}>
                                <Text style={styles.headerText}>Edit task</Text>
                            </View>
                            <View style={styles.topRightView}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.buttonClose]}
                                    onPress={() => setModalVisible(!modalVisible)}>
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <EditTask task_id={route.params.task_id} leaveModal={() => { setModalVisible(!modalVisible); refreshData(); }} />
                    </View>
                </Modal>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        backgroundColor: "white"
    },
    notes: {
        height: 100,
        padding: "0%"
    },
    first_row: {
        flex: 1,
        marginLeft: 35,
        marginRight: 35,
        marginTop: 20,
        flexDirection: "row",
        borderTopWidth: StyleSheet.hairlineWidth,
        borderLeftWidth: StyleSheet.hairlineWidth,
        borderRightWidth: StyleSheet.hairlineWidth,
        alignItems: "center",
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10
    },
    row_with_borderTop: {
        flex: 1,
        marginLeft: 35,
        marginRight: 35,
        flexDirection: "row",
        borderTopWidth: StyleSheet.hairlineWidth,
        borderLeftWidth: StyleSheet.hairlineWidth,
        borderRightWidth: StyleSheet.hairlineWidth,
        alignItems: "center",
    },
    labelText: {
        fontSize: 13,
        marginLeft: 10,
        flex: 1,
        padding: 10,
    },
    duedate_view: {
        flex: 1,
        marginLeft: 35,
        marginRight: 35,
        flexDirection: "row",
        borderLeftWidth: StyleSheet.hairlineWidth,
        borderRightWidth: StyleSheet.hairlineWidth,
        alignItems: "center",
    },
    date_time_picker: {
        marginLeft: 35,
        marginRight: 35,
        borderLeftWidth: StyleSheet.hairlineWidth,
        borderRightWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    datetimepickerText: {
        backgroundColor: "#E9ECEF",
        borderRadius: 10,
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 5,
        paddingBottom: 5,
        marginTop: 5,
        marginBottom: 5,
        marginRight: 10
    },
    dropdownButtonStyle: {
        flex: 1,
        padding: 5,
        backgroundColor: '#E9ECEF',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10

    },
    dropdownButtonTxtStyle: {
        flex: 1,
        fontWeight: '500',
        color: '#151E26',
        textAlign: 'center',
    },
    dropdownMenuStyle: {
        backgroundColor: '#E9ECEF',
        borderRadius: 8,
    },
    dropdownItemStyle: {
        width: '100%',
        flexDirection: 'row',
        paddingHorizontal: 12,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#B1BDC8',
    },
    dropdownItemTxtStyle: {
        flex: 1,
        fontWeight: '500',
        color: '#151E26',
        textAlign: 'center',
    },
    dropdownItemIconStyle: {
        marginRight: 8,
    },
    toggleSwitch: {
        marginRight: 10,
    },
    attachmentText: {
        paddingTop: 5,
        paddingBottom: 5,
        backgroundColor: "#E9ECEF",
        borderRadius: 10,
        paddingLeft: 10,
        paddingRight: 10,
        marginRight: 10,
        marginTop: 5,
        marginBottom: 5
    },
    fileText: {
        width: 120,
    },
    title: {
        color: "black",
        fontSize: 17,
        marginLeft: 35,
        marginRight: 35,
        fontWeight: "bold"
    },
    grayText: {
        color: "#787878",
        fontSize: 13,
        marginLeft: 35,
    },
    label: {
        color: "#787878",
        fontSize: 15,
        marginLeft: 35,
        marginRight: 35,
        marginTop: 10,
    },
    text: {
        color: "black",
        fontSize: 15,
        marginLeft: 35,
        marginRight: 35,
        marginTop: 5,
        marginBottom: 5,
        width: 300
    },
    notes: {
        color: "black",
        fontSize: 15,
        marginLeft: 35,
        marginRight: 35,
        marginBottom: 10,
    },
    saveButton: {
        alignSelf: "flex-end",
        marginRight: 35,
        marginTop: 5,
        padding: 5,
        backgroundColor: "#64ADF9",
        borderRadius: 10
    },
    saveButtonText: {
        color: "white"
    },
    editText: {
        color: "black",
        fontSize: 15,
        marginRight: 35,
        marginTop: 10,
        alignSelf: "flex-end"
    },
    modalView: {
        marginTop: '10%',
        paddingTop: 20,
        backgroundColor: 'white',
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2, },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 5,
        height: '100%',
        width: '100%',
    },
    topView: {
        flex: 1,
        flexDirection: 'row',
        maxHeight: 30
    },
    topLeftView: {
        width: '33.33%',
        paddingLeft: 20
    },
    topCenterView: {
        width: '33.33%',
        alignItems: 'center',
        justifyContent: 'center'
    },
    topRightView: {
        width: '33.33%',
        alignItems: 'flex-end',
        paddingRight: 20,
        justifyContent: 'center'
    },
    headerText: {
        fontWeight: 'bold',
        fontSize: 18,
    },
    cancelText: {
        fontSize: 15,
        color: 'red',
    },
});

export default ViewTask;

// Reference
// 1. Modal and modal styles
// React Native. (2024) Modal [Online]. Available from: // https://reactnative.dev/docs/modal.html [19 July 2024]




