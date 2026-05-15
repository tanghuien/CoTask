//editTask
import React, { useState, useCallback, useEffect } from 'react';
import { View, ScrollView, StyleSheet, KeyboardAvoidingView, TouchableOpacity, LogBox, Switch, Alert, TextInput, SafeAreaView, Text, Pressable, Modal } from 'react-native';
import Mytextinput from './components/Mytextinput';

import Mybutton from './components/Mybutton';
import { openDatabase } from 'react-native-sqlite-storage';
import DateTimePicker, { useDefaultStyles } from 'react-native-ui-datepicker';
import dayjs from 'dayjs';
import SelectDropdown from 'react-native-select-dropdown'
import Icon from 'react-native-vector-icons/Octicons';
import DocumentPicker, { types } from 'react-native-document-picker';
import FileViewer from "react-native-file-viewer";
import notifee, { TimestampTrigger, TriggerType } from '@notifee/react-native';
import { Swipeable } from 'react-native-gesture-handler';

var db = openDatabase({ name: 'database.db' });

const EditTask = (props) => {
    const defaultStyles = useDefaultStyles();

    const [refreshed, setRefreshed] = useState(false);
    const [task, setTask] = useState([]);
    const [taskTitle, setTaskTitle] = useState('');
    const [taskNote, setTaskNote] = useState('');
    const [priority_level, setPriority_level] = useState("none");
    const [duedate, setDuedate] = useState(dayjs());
    const [duedate_picker_isVisible, setDutedate_picker_IsVisible] = useState(false);
    const [reminderIsEnabled, setReminderIsEnabled] = useState(false);
    const [reminder_picker_isVisible, setReminder_picker_IsVisible] = useState(false);
    const [reminder_datetime, setReminderDateTime] = useState(dayjs().add(10, "minutes"));
    const [cancelReminder, setCancelReminder] = useState(false);
    const [repeatIsEnabled, setRepeatIsEnabled] = useState(false);
    const [repeat_picker_isVisible, setRepeat_picker_IsVisible] = useState(false);
    const [frequency, setFrequency] = useState("daily");
    const [repeatStartDate, setRepeatStartDate] = useState(dayjs());
    const [repeatEndDate, setRepeatEndDate] = useState(dayjs().add(3, "day"));
    const [fileResponse, setFileResponse] = useState([]);

    var isSameOrAfter = require("dayjs/plugin/isSameOrAfter");
    dayjs.extend(isSameOrAfter);

    let priority_lvls = ["none", "low", "medium", "high"];
    let frequencies = ["daily", "weekly", "monthly", "yearly"];
    let taskPoints = 0;

    const refreshData = async () => {
        LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

        // in case, async storage limitation
        // await AsyncStorage.clear();
        try {
            const taskData = await getTaskFromDB();
            setTask(taskData);
        } catch (error) {
            // console.error('Error refreshing data at home page:', error);
        }

    };



    const getTaskFromDB = async () => {
        return new Promise((resolve, reject) => {
            db.transaction((tx) => {
                tx.executeSql('SELECT * FROM Tasks WHERE task_id = ?', [props.task_id], (tx, results) => {
                    const taskData = results.rows.item(0);
                    resolve(taskData);
                }, (error) => {
                    reject(error);
                });
            });
        });
    };

    useEffect(() => {

        if (!refreshed) {
            refreshData();
            setRefreshed(true);
        }
        else {
            setDuedate(task.due_date);
            setReminderDateTime(task.reminder_datetime);
            setRepeatStartDate(dayjs(task.repeat_start_date));
            setRepeatEndDate(dayjs(task.repeat_end_date));

            if (task.attachment_path) {
                setFileResponse([{ uri: task.attachment_path, name: task.attachment_name }]);
            }

            if (dayjs().isSameOrAfter(dayjs(task.reminder_datetime))) {
                setCancelReminder(true);
            }
            else {
                setCancelReminder(false);
            }

            if (task.reminder === 1) {
                setReminderIsEnabled(true);
            }

            if (task.repeat === 1) {
                setRepeatIsEnabled(true);
            }
        }
    }, [refreshed, task]);

    const handleDocumentSelection = useCallback(async () => {
        try {
            const response = await DocumentPicker.pick({
                presentationStyle: 'fullScreen',
            });
            setFileResponse(response);
        } catch (err) {
            // console.warn(err);
            // alert
        }
    }, []);

    const onCreateTriggerNotification = async (datetime) => {
        await notifee.requestPermission();

        const trigger = {
            trigger: TimestampTrigger,
            type: TriggerType.TIMESTAMP,
            timestamp: dayjs(datetime).valueOf(),
        };

        await notifee.createTriggerNotification(
            {
                title: taskTitle,
                body: "Due date: " + dayjs(duedate).format('D MMMM YYYY'),
            },
            trigger,
        );

    };

    const reminderToogleSwitch = () => {
        LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

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
    };

    const repeatTask = (timeUnit) => {
        if (repeatEndDate) {
            let repeatTimes = dayjs(repeatEndDate).diff(dayjs(repeatStartDate), timeUnit);

            for (let i = 1; i < repeatTimes+1 ; i++) {
                if (fileResponse == "") {
                    db.transaction((tx) => {
                        tx.executeSql(
                            'UPDATE Tasks set task_title =?, task_note=?, priority_level=?, updated_date=?, due_date=?, reminder=?, reminder_datetime=?, repeat=?, repeat_frequency=?, repeat_start_date=?, repeat_end_date=?, attachment_path=?, attachment_name=? where task_id=?',
                            [taskTitle, taskNote, priority_level, dayjs().format("YYYY-MM-DD"), dayjs(repeatStartDate).format("YYYY-MM-DD"), reminderIsEnabled, reminder_datetime.toString(), repeatIsEnabled, frequency, repeatStartDate.toString(), repeatEndDate.toString(), "", "", props.task_id],
                        );
                        tx.executeSql(
                            'DELETE FROM Tasks WHERE created_timestamp=? AND task_id!=?',
                            [task.created_timestamp, props.task_id]
                        );
                        tx.executeSql(
                            'INSERT INTO Tasks (task_title, task_note, priority_level, created_timestamp, updated_date, due_date, reminder, reminder_datetime, repeat, repeat_frequency, repeat_start_date, repeat_end_date, attachment_name, attachment_path, completed, completed_date, task_points, user_id) VALUES (?,?,?,CURRENT_TIMESTAMP,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                            [taskTitle, taskNote, priority_level, null, dayjs(repeatStartDate).add(i, timeUnit).format("YYYY-MM-DD"), reminderIsEnabled, reminder_datetime.toString(), repeatIsEnabled, frequency, repeatStartDate.format("YYYY-MM-DD").toString(), repeatEndDate.format("YYYY-MM-DD").toString(), "", "", false, "", taskPoints, 1],
                        );
                    });
                }
                else {
                    db.transaction((tx) => {
                        tx.executeSql(
                            'UPDATE Tasks set task_title =?, task_note=?, priority_level=?, updated_date=?, due_date=?, reminder=?, reminder_datetime=?, repeat=?, repeat_frequency=?, repeat_start_date=?, repeat_end_date=?, attachment_path=?, attachment_name=?, task_points=? where task_id=?',
                            [taskTitle, taskNote, priority_level, dayjs().format("YYYY-MM-DD"), dayjs(repeatStartDate).format("YYYY-MM-DD"), reminderIsEnabled, reminder_datetime.toString(), repeatIsEnabled, frequency, repeatStartDate.toString(), repeatEndDate.toString(), fileResponse[0].uri, fileResponse[0].name, taskPoints, props.task_id],
                        );
                        tx.executeSql(
                            'DELETE FROM Tasks WHERE created_timestamp=? AND task_id!=?',
                            [task.created_timestamp, props.task_id]
                        );
                        tx.executeSql(
                            'INSERT INTO Tasks (task_title, task_note, priority_level, created_timestamp, updated_date, due_date, reminder, reminder_datetime, repeat, repeat_frequency, repeat_start_date, repeat_end_date, attachment_name, attachment_path, completed, completed_date, task_points, user_id) VALUES (?,?,?,CURRENT_TIMESTAMP,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                            [taskTitle, taskNote, priority_level, null, dayjs(repeatStartDate).add(i, timeUnit).format("YYYY-MM-DD"), reminderIsEnabled, reminder_datetime.toString(), repeatIsEnabled, frequency, repeatStartDate.format("YYYY-MM-DD").toString(), repeatEndDate.format("YYYY-MM-DD").toString(), fileResponse[0].uri, fileResponse[0].name, false, "", taskPoints, 1],
                        );
                    });
                }
            };
        }
    };

    const repeatToogleSwitch = () => {
        setRepeatIsEnabled(previousState => !previousState);

        if (repeatIsEnabled) {
            setRepeat_picker_IsVisible(false);
        };
    };

    let update_task = () => {

        if (repeatEndDate == undefined) {
            Alert.alert("Please select an end repeat date");
        }

        if (reminderIsEnabled && dayjs(reminder_datetime).isAfter(dayjs())) {
            onCreateTriggerNotification(reminder_datetime);
        }

        taskPoints += 100;
        switch (priority_level) {
            case "low":
                taskPoints += 10;
                break;
            case "medium":
                taskPoints += 20;
                break;
            case "high":
                taskPoints += 30;
                break;
        };

        if (repeatIsEnabled) {
            switch (frequency) {
                case "daily":
                    repeatTask("day");
                    break;
                case "weekly":
                    repeatTask("week");
                    break;
                case "monthly":
                    repeatTask("month");
                    break;
                case "yearly":
                    repeatTask("year");
                    break;
            };
        }
        else {
            if (fileResponse == "") {
                db.transaction((tx) => {
                    tx.executeSql(
                        'UPDATE Tasks set task_title =?, task_note=?, priority_level=?, updated_date=?, due_date=?, reminder=?, reminder_datetime=?, attachment_name=?, attachment_path=?, task_points=? where task_id=?',
                        [taskTitle, taskNote, priority_level, dayjs().format("YYYY-MM-DD"), dayjs(duedate).format("YYYY-MM-DD"), reminderIsEnabled, reminder_datetime.toString(), "", "", taskPoints, props.task_id],
                    );
                });
            }
            else {
                db.transaction((tx) => {
                    tx.executeSql(
                        'UPDATE Tasks set task_title =?, task_note=?, priority_level=?, updated_date=?, due_date=?, reminder=?, reminder_datetime=?, attachment_name=?, attachment_path=?, task_points=? where task_id=?',
                        [taskTitle, taskNote, priority_level, dayjs().format("YYYY-MM-DD"), dayjs(duedate).format("YYYY-MM-DD"), reminderIsEnabled, reminder_datetime.toString(), fileResponse[0].name, fileResponse[0].uri, taskPoints, props.task_id],
                    );
                });
            }
        }

        props.leaveModal();
    };

    return (
        <View style={styles.container}>
            <ScrollView keyboardShouldPersistTaps="handled">
                <KeyboardAvoidingView
                    behavior="padding"
                    style={{ flex: 1, justifyContent: 'space-between' }}>
                    <View>
                        <View>
                            <Mytextinput title="Title" defaultValue={task.task_title} onChangeText={(taskTitle) => setTaskTitle(taskTitle)} autoFocus="true" />
                            <View style={styles.row_with_borderBottom}>
                                <Text style={styles.labelText}>Priority level: </Text>
                                <SelectDropdown
                                    data={priority_lvls}
                                    onSelect={(priority_level) => {
                                        setPriority_level(priority_level);
                                    }}
                                    defaultValue={task.priority_level}
                                    // use default value by index or default value
                                    renderButton={(priority_level, isOpen) => {
                                        return (
                                            <View style={styles.dropdownButtonStyle}>
                                                <Text style={styles.dropdownButtonTxtStyle}>{priority_level}</Text>
                                                <Icon name="triangle-down" size={20} color="black" />
                                            </View>
                                        );
                                    }}
                                    renderItem={(item, index, isSelected) => {
                                        return (
                                            <View
                                                style={{
                                                    ...styles.dropdownItemStyle,
                                                    ...(isSelected && { backgroundColor: '#D2D9DF' }),
                                                }}>
                                                <Text style={styles.dropdownItemTxtStyle}>{item}</Text>
                                            </View>
                                        );
                                    }}
                                    dropdownStyle={styles.dropdownMenuStyle}
                                />
                            </View>

                            <View style={styles.duedate_view}>
                                <Text style={styles.labelText}>Due date: </Text>
                                <Pressable style={styles.datetimepickerText} onPress={() => setDutedate_picker_IsVisible(!duedate_picker_isVisible)}>
                                    <Text>{dayjs(duedate).format('D MMM YYYY')}</Text>
                                </Pressable>
                            </View>

                            <View style={styles.date_time_picker}>
                                {duedate_picker_isVisible && <DateTimePicker
                                    mode="single"
                                    date={duedate}
                                    weekdaysFormat = "short"
                                    styles={{
                                        ...defaultStyles,
                                        today: { backgroundColor: "white", borderColor: '#64ADF9', borderWidth: 2, borderRadius: 50, },
                                        today_label: { color: "#64ADF9" },
                                        selected: { backgroundColor: "#64ADF9", borderRadius: 50 }, 
                                        selected_label: { color: 'white' }, 
                                    }}
                                    onChange={(params) => setDuedate(params.date)}
                                />}
                            </View>
                        </View>

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
                                        today: { backgroundColor: "white", borderColor: '#64ADF9', borderWidth: 2, borderRadius: 50, },
                                        today_label: { color: "#64ADF9" },
                                        selected: { backgroundColor: "#64ADF9", borderRadius: 50 }, 
                                        selected_label: { color: 'white' }, 
                                    }}
                                    onChange={(params) => selectReminder(params.date)}
                                />}
                            </View>
                        </View>

                        <View>

                            <View style={styles.first_row}>
                                <Text style={styles.labelText}>Repeat: </Text>
                                <Switch
                                    trackColor={{ false: '#E9ECEF', true: '#A2CFFE' }}
                                    thumbColor={"white"}
                                    ios_backgroundColor="#E9ECEF"
                                    onValueChange={repeatToogleSwitch}
                                    value={repeatIsEnabled}
                                    style={styles.toggleSwitch}
                                />
                            </View>

                            {repeatIsEnabled &&
                                <View>
                                    <View style={styles.row_with_borderTop}>
                                        <Text style={styles.labelText}>Frequency: </Text>
                                        <SelectDropdown
                                            data={frequencies}
                                            onSelect={(frequency) => {
                                                setFrequency(frequency);
                                            }}
                                            defaultValue={'daily'}
                                            // use default value by index or default value
                                            renderButton={(frequency, isOpen) => {
                                                return (
                                                    <View style={styles.dropdownButtonStyle}>
                                                        <Text style={styles.dropdownButtonTxtStyle}>{frequency}</Text>
                                                        <Icon name="triangle-down" size={20} color="black" />
                                                    </View>
                                                );
                                            }}
                                            renderItem={(item, index, isSelected) => {
                                                return (
                                                    <View
                                                        style={{
                                                            ...styles.dropdownItemStyle,
                                                            ...(isSelected && { backgroundColor: '#D2D9DF' }),
                                                        }}>
                                                        <Text style={styles.dropdownItemTxtStyle}>{item}</Text>
                                                    </View>
                                                );
                                            }}
                                            dropdownStyle={styles.dropdownMenuStyle}
                                        />
                                    </View>

                                    <View style={styles.row_with_borderTop}>
                                        <Text style={styles.labelText}>Range: </Text>
                                        <Pressable style={styles.datetimepickerText} onPress={() => setRepeat_picker_IsVisible(!repeat_picker_isVisible)}>
                                            {repeatEndDate ?
                                                <Text>{dayjs(repeatStartDate).format('D MMM YYYY')} - {dayjs(repeatEndDate).format('D MMM YYYY')}</Text> :
                                                <Text style={{ textDecorationLine: "line-through" }}>{dayjs(repeatStartDate).format('D MMM YYYY')} -</Text>
                                            }
                                        </Pressable>
                                    </View>
                                </View>
                            }

                            <View style={styles.date_time_picker}>
                                {repeat_picker_isVisible && <DateTimePicker
                                    mode="range"
                                    startDate={repeatStartDate}
                                    endDate={repeatEndDate}
                                    weekdaysFormat="short"
                                    styles={{
                                        ...defaultStyles,
                                        today: { backgroundColor: "white", borderColor: '#64ADF9', borderWidth: 2, borderRadius: 50 },
                                        today_label: { color: "#64ADF9" },
                                        selected: { backgroundColor: "#64ADF9", borderRadius: 50 },
                                        selected_label: { color: "white" },
                                        range_fill: { backgroundColor: '#64ADF925', marginVertical: 5 },
                                    }}
                                    onChange={(params) => {
                                        setRepeatStartDate(params.startDate);
                                        setRepeatEndDate(params.endDate);
                                    }} />
                                }
                            </View>
                        </View>

                        <View>
                            <Mytextinput title="Notes" defaultValue={task.task_note} onChangeText={(taskNote) => setTaskNote(taskNote)} style={styles.notes} multiline={true} numberOfLines={4} />
                            <View style={styles.row_with_borderBottom}>
                                <Pressable style={styles.attachmentText} onPress={handleDocumentSelection}>
                                    <Text>Select Attachment</Text>
                                </Pressable>
                                {!fileResponse[0] ?
                                    <Text>No file is selected</Text>
                                    :

                                    (<Swipeable
                                        friction={2}
                                        leftThreshold={40}
                                        rightThreshold={40}
                                        renderRightActions={() => (
                                            <View style={styles.deleteIcon}>
                                                <Icon name="trash" size={10} color={"white"} />
                                            </View>
                                        )}
                                        onSwipeableRightOpen={() => setFileResponse([])}><Pressable onPress={() => FileViewer.open(fileResponse[0].uri)}>
                                            <Text numberOfLines={1} style={styles.fileText}><Icon name="file" size={13} color={"black"} /> {fileResponse[0].name}</Text>
                                        </Pressable></Swipeable>)
                                }
                            </View>
                        </View>
                    </View>
                    <Mybutton title="Edit" accessibilityRole="editButton" customClick={update_task} style={{ display: "flex" }} />
                </KeyboardAvoidingView>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
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
    row_with_borderBottom: {
        flex: 1,
        marginLeft: 35,
        marginRight: 35,
        flexDirection: "row",
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderLeftWidth: StyleSheet.hairlineWidth,
        borderRightWidth: StyleSheet.hairlineWidth,
        justifyContent: "center",
        alignItems: "center"
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
    deleteIcon: {
        flex: 1,
        backgroundColor: "#FF746C",
        justifyContent: "center",
        alignItems: "flex-end"
    },
});

export default EditTask;


