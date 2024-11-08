//@ts-nocheck
import { Switch } from "@headlessui/react";
import { CheckCircleIcon } from "@heroicons/react/20/solid";
import moment from "moment";
import { useRouter } from "next/router";
import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery } from "react-query";
import { Text, Tooltip } from "@radix-ui/themes";
import { getCookie } from "cookies-next";
import useTranslation from "next-translate/useTranslation";
import Frame from "react-frame-component";
import { useDebounce } from "use-debounce";
import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";

import { useUser } from "../../store/session";
import { IconCombo, UserCombo } from "../Combo";
import {
  CircleCheck,
  CircleDotDashed,
  Ellipsis,
  Eye,
  EyeClosed,
  EyeOff,
  LifeBuoy,
  Loader,
  LoaderCircle,
  Lock,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Trash,
  Trash2,
  Unlock,
} from "lucide-react";
import { toast } from "@/shadcn/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import { IconKeyboardHide } from "@tabler/icons-react";

const ticketStatusMap = [
  { id: 1, value: "needs_support", name: "Needs Support", icon: LifeBuoy },
  { id: 2, value: "in_progress", name: "In Progress", icon: CircleDotDashed },
  { id: 3, value: "in_review", name: "In Review", icon: Loader },
  { id: 4, value: "done", name: "Done", icon: CircleCheck },
];

const priorityOptions = [
  {
    id: "1",
    name: "Low",
    value: "low",
    icon: SignalLow,
  },
  {
    id: "2",
    name: "Medium",
    value: "medium",
    icon: SignalMedium,
  },
  {
    id: "1",
    name: "High",
    value: "high",
    icon: SignalHigh,
  },
];

export default function Ticket() {
  const router = useRouter();
  const { t } = useTranslation("peppermint");

  const token = getCookie("session");

  const { user } = useUser();

  const fetchTicketById = async () => {
    const id = router.query.id;
    const res = await fetch(`/api/v1/ticket/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.json();
  };

  const { data, status, refetch } = useQuery("fetchTickets", fetchTicketById, {
    enabled: false,
  });

  useEffect(() => {
    refetch();
  }, [router]);

  const [initialContent, setInitialContent] = useState<
    PartialBlock[] | undefined | "loading"
  >("loading");

  const editor = useMemo(() => {
    if (initialContent === "loading") {
      return undefined;
    }
    return BlockNoteEditor.create({ initialContent });
  }, [initialContent]);

  const [edit, setEdit] = useState(false);
  const [editTime, setTimeEdit] = useState(false);
  const [assignedEdit, setAssignedEdit] = useState(false);
  const [labelEdit, setLabelEdit] = useState(false);

  const [users, setUsers] = useState<any>();
  const [n, setN] = useState<any>();

  const [note, setNote] = useState<any>();
  const [issue, setIssue] = useState<any>();
  const [title, setTitle] = useState<any>();
  // const [uploaded, setUploaded] = useState<any>();
  const [priority, setPriority] = useState<any>();
  const [ticketStatus, setTicketStatus] = useState<any>();
  const [comment, setComment] = useState<any>();
  const [timeSpent, setTimeSpent] = useState<any>();
  const [publicComment, setPublicComment] = useState<any>(false);
  const [timeReason, setTimeReason] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const history = useRouter();

  const { id } = history.query;

  async function update() {
    if (data && data.ticket && data.ticket.locked) return;

    await fetch(`/api/v1/ticket/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id,
        detail: JSON.stringify(debouncedValue),
        note,
        title: debounceTitle,
        priority: priority ? priority.value : undefined,
        status: ticketStatus ? ticketStatus.value : undefined,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        setEdit(false);
        // refetch();
      });
  }

  async function updateStatus() {
    if (data && data.ticket && data.ticket.locked) return;

    await fetch(`/api/v1/ticket/status/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status: !data.ticket.isComplete,
        id,
      }),
    })
      .then((res) => res.json())
      .then(() => refetch());
  }

  async function hide(hidden) {
    if (data && data.ticket && data.ticket.locked) return;

    await fetch(`/api/v1/ticket/status/hide`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        hidden,
        id,
      }),
    })
      .then((res) => res.json())
      .then(() => refetch());
  }

  async function lock(locked) {
    await fetch(`/api/v1/ticket/status/lock`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        locked,
        id,
      }),
    })
      .then((res) => res.json())
      .then(() => refetch());
  }

  async function deleteIssue(locked) {
    await fetch(`/api/v1/ticket/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          toast({
            variant: "default",
            title: "Issue Deleted",
            description: "The issue has been deleted",
          });
          router.push("/issues");
        }
      });
  }

  async function addComment() {
    if (data && data.ticket && data.ticket.locked) return;

    await fetch(`/api/v1/ticket/comment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        text: comment,
        id,
        public: publicComment,
      }),
    })
      .then((res) => res.json())
      .then(() => refetch());
  }

  async function addTime() {
    if (data && data.ticket && data.ticket.locked) return;

    await fetch(`/api/v1/time/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        time: timeSpent,
        ticket: id,
        title: timeReason,
        user: user.id,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setTimeEdit(false);
          refetch();
          toast({
            variant: "default",
            title: "Time Added",
            description: "Time has been added to the ticket",
          });
        }
      });
  }

  async function fetchUsers() {
    await fetch(`/api/v1/users/all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res) {
          setUsers(res.users);
        }
      });
  }

  async function transferTicket() {
    if (data && data.ticket && data.ticket.locked) return;

    if (n !== undefined) {
      await fetch(`/api/v1/ticket/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user: n.id,
          id,
        }),
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.success) {
            setAssignedEdit(false);
            refetch();
          }
        });
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user", user.id);

      try {
        // You can write the URL of your server or any other endpoint used for file upload
        const result = await fetch(
          `/api/v1/storage/ticket/${router.query.id}/upload/single`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await result.json();

        if (data.success) {
          setFile(null);
          refetch();
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const fileInputRef = useRef(null);

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  useEffect(() => {
    handleUpload();
  }, [file]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    transferTicket();
  }, [n]);

  const [debouncedValue] = useDebounce(issue, 500);
  const [debounceTitle] = useDebounce(title, 500);

  useEffect(() => {
    update();
  }, [priority, ticketStatus, debounceTitle]);

  useEffect(() => {
    if (issue) {
      update();
    }
  }, [debouncedValue]);

  async function loadFromStorage() {
    const storageString = data.ticket.detail as PartialBlock[];
    // if (storageString && isJsonString(storageString)) {
    //   return JSON.parse(storageString) as PartialBlock[]
    // } else {
    //   return undefined;
    // }
    try {
      return JSON.parse(storageString) as PartialBlock[];
    } catch (e) {
      return undefined;
    }
  }

  async function convertHTML() {
    const blocks = (await editor.tryParseHTMLToBlocks(
      data.ticket.detail
    )) as PartialBlock[];
    editor.replaceBlocks(editor.document, blocks);
  }

  // Loads the previously stored editor contents.
  useEffect(() => {
    if (status === "success") {
      loadFromStorage().then((content) => {
        if (typeof content === "object") {
          setInitialContent(content);
        } else {
          setInitialContent(undefined);
        }
      });
    }
  }, [status, data]);

  useEffect(() => {
    if (initialContent === undefined) {
      convertHTML();
    }
  }, [initialContent]);

  if (editor === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderCircle className="animate-spin" />
      </div>
    );
  }

  const handleInputChange = (editor) => {
    if (data.ticket.locked) return;
    setIssue(editor.document);
  };

  return (
    <div>
      {status === "loading" && (
        <div className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
          <h2> Loading data ... </h2>
          {/* <Spin /> */}
        </div>
      )}

      {status === "error" && (
        <div className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold"> Error fetching data ... </h2>
        </div>
      )}

      {status === "success" && (
        <main className="flex-1 min-h-[90vh] py-8">
          <div className="mx-auto max-w-7xl w-full px-4 flex flex-col xl:flex-row justify-center">
            <div className="xl:border-r xl:pr-8 xl:w-2/3">
              <div className="">
                <div className="md:flex md:justify-between md:space-x-4 xl:border-b xl:pb-4">
                  <div className="w-full">
                    <div className="flex flex-row space-x-1">
                      <h1 className="text-2xl mt-[5px] font-bold text-foreground">
                        #{data.ticket.Number} -
                      </h1>
                      <input
                        type="text"
                        name="title"
                        id="title"
                        style={{ fontSize: "1.5rem" }}
                        className="border-none -mt-[1px] px-0 pl-0.5 w-3/4 truncated m block text-foreground bg-transparent font-bold focus:outline-none focus:ring-0 placeholder:text-primary sm:text-sm sm:leading-6"
                        value={title}
                        defaultValue={data.ticket.title}
                        onChange={(e) => setTitle(e.target.value)}
                        key={data.ticket.id}
                        disabled={data.ticket.locked}
                      />
                    </div>
                    <div className="mt-2 text-xs flex flex-row justify-between items-center space-x-1 text-gray-500 dark:text-white">
                      <div className="flex flex-row space-x-1 items-center">
                        {data.ticket.client && (
                          <div>
                            <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
                              {data.ticket.client.name}
                            </span>
                          </div>
                        )}
                        <div>
                          {!data.ticket.isComplete ? (
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                {t("open_issue")}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                                {t("closed_issue")}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
                            {data.ticket.type}
                          </span>
                        </div>
                        {data.ticket.hidden && (
                          <div>
                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                              Hidden
                            </span>
                          </div>
                        )}
                        {data.ticket.locked && (
                          <div>
                            <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                              Locked
                            </span>
                          </div>
                        )}
                      </div>
                      {user.isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center px-2 py-1 text-xs font-medium text-foreground ring-none outline-none ">
                            <Ellipsis className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="min-w-[160px]"
                          >
                            <DropdownMenuLabel>
                              <span>{t("issue_actions")}</span>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {data.ticket.hidden ? (
                              <DropdownMenuItem
                                className="flex flex-row space-x-3 items-center"
                                onClick={() => hide(false)}
                              >
                                <Eye className="h-4 w-4" />
                                <span>{t("show_issue")}</span>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="flex flex-row space-x-3 items-center"
                                onClick={() => hide(true)}
                              >
                                <EyeOff className="h-4 w-4" />
                                <span>{t("hide_issue")}</span>
                              </DropdownMenuItem>
                            )}
                            {data.ticket.locked ? (
                              <DropdownMenuItem
                                className="flex flex-row space-x-3 items-center"
                                onClick={() => lock(false)}
                              >
                                <Unlock className="h-4 w-4" />
                                <span>{t("unlock_issue")}</span>
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="flex flex-row space-x-3 items-center"
                                onClick={() => lock(true)}
                              >
                                <Lock className="h-4 w-4" />
                                <span>{t("lock_issue")}</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="flex flex-row space-x-3 items-center transition-colors duration-200 focus:bg-red-500 focus:text-white"
                              onClick={() => deleteIssue()}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="">{t("delete")}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </div>
                <aside className="mt-4 xl:hidden">
                  <div className="border-b pb-1">
                    <div className="border-t pt-1">
                      <div className="flex flex-col sm:flex-row space-x-2">
                        <div className="ml-2">
                          {users && (
                            <UserCombo
                              value={users}
                              update={setN}
                              defaultName={
                                data.ticket.assignedTo
                                  ? data.ticket.assignedTo.name
                                  : ""
                              }
                              disabled={data.ticket.locked}
                            />
                          )}
                        </div>

                        <IconCombo
                          value={priorityOptions}
                          update={setPriority}
                          defaultName={
                            data.ticket.priority ? data.ticket.priority : ""
                          }
                          disabled={data.ticket.locked}
                        />

                        <IconCombo
                          value={ticketStatusMap}
                          update={setTicketStatus}
                          defaultName={
                            data.ticket.status ? data.ticket.status : ""
                          }
                          disabled={data.ticket.locked}
                        />
                      </div>
                    </div>
                  </div>
                </aside>
                <div className="py-3 xl:pb-0 xl:pt-2">
                  <div className="flex flex-row items-center text-sm space-x-1">
                    {data.ticket.fromImap ? (
                      <>
                        <span className="font-bold">{data.ticket.email}</span>
                        <span>{t("created_via_email")} </span>
                        <span className="font-bold">
                          {moment(data.ticket.createdAt).format("DD/MM/YYYY")}
                        </span>
                      </>
                    ) : (
                      <>
                        {data.ticket.createdBy ? (
                          <div className="flex flex-row space-x-1">
                            <span>
                              {t("created_by")}
                              <strong>
                                {data.ticket.createdBy.name}
                              </strong> {t("at")}{" "}
                            </span>
                            <span className="">
                              {moment(data.ticket.createdAt).format("LLL")}
                            </span>
                            {data.ticket.name && (
                              <span>
                                {t("for")} <strong>{data.ticket.name}</strong>
                              </span>
                            )}
                            {data.ticket.email && (
                              <span>
                                ( <strong>{data.ticket.email}</strong> )
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-row space-x-1">
                            <span>{t("created_at")} </span>
                            <span className="">
                              <strong>
                                {moment(data.ticket.createdAt).format("LLL")}
                              </strong>
                              {data.ticket.client && (
                                <span>
                                  {t("for")} <strong>{data.ticket.client.name}</strong>
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="prose max-w-none mt-2">
                    {!data.ticket.fromImap ? (
                      <>
                        <BlockNoteView
                          editor={editor}
                          sideMenu={false}
                          className="m-0 p-0 bg-transparent dark:text-white"
                          onChange={handleInputChange}
                          editable={!data.ticket.locked}
                        />
                      </>
                    ) : (
                      <div className="">
                        <div className="break-words bg-white rounded-md text-black">
                          <Frame
                            className="min-h-[60vh] h-full w-full"
                            initialContent={data.ticket.detail}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <section
                aria-labelledby="activity-title"
                className="mt-8 xl:mt-10"
              >
                <div>
                  <div className="divide-y">
                    <div className="pb-2">
                      <span
                        id="activity-title"
                        className="text-lg font-medium text-gray-900 dark:text-white"
                      >
                        {t("comments")}
                      </span>
                    </div>
                    <div className="pt-2">
                      {/* Activity feed*/}
                      <div className="flow-root">
                        <ul role="list" className="-mb-8">
                          {data.ticket.comments.length > 0 &&
                            data.ticket.comments.map(
                              (item: any, itemIdx: any) => (
                                <li key={item.id}>
                                  <div className="relative pb-8">
                                    {itemIdx !==
                                    data.ticket.comments.length - 1 ? (
                                      <span
                                        className="absolute left-3 top-5 -ml-px h-full w-0.5 bg-gray-200"
                                        aria-hidden="true"
                                      />
                                    ) : null}
                                    <div className="relative flex items-start space-x-3">
                                      <div className="relative">
                                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-500">
                                          <span className="font-medium leading-none text-xs text-white uppercase">
                                            {item.user
                                              ? item.user.name[0]
                                              : item.replyEmail[0]}
                                          </span>
                                        </span>
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div>
                                          <div className="text-sm">
                                            <span className="font-medium text-gray-900 dark:text-white ">
                                              {item.user
                                                ? item.user.name
                                                : item.replyEmail}
                                            </span>
                                          </div>
                                          <div className=" flex flex-row space-x-1">
                                            <span
                                              className={`text-xs ${
                                                item.public
                                                  ? "text-primary font-semibold"
                                                  : "text-gray-500"
                                              } dark:text-white`}
                                            >
                                              {item.public
                                                ? t("publicly")
                                                : t("internally")}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-white">
                                              {t("commented_at")}
                                            </span>

                                            <span className="text-xs text-gray-500 dark:text-white">
                                              {moment(item.createdAt).format(
                                                "DD/MM/YYYY hh:mm"
                                              )}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="text-sm  text-gray-900 dark:text-white">
                                          <span>{item.text}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </li>
                              )
                            )}
                        </ul>
                      </div>
                      <div className="mt-6">
                        <div className="flex space-x-3">
                          <div className="min-w-0 flex-1">
                            <div>
                              <div>
                                <label htmlFor="comment" className="sr-only">
                                  {t("comment")}
                                </label>
                                <textarea
                                  id="comment"
                                  name="comment"
                                  rows={3}
                                  className="block w-full bg-transparent rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-background focus:ring-0 focus:ring-inset focus:ring-gray-900 sm:text-sm sm:leading-6"
                                  placeholder={
                                    data.ticket.locked
                                      ? t("ticket_locked")
                                      : t("leave_comment")
                                  }
                                  defaultValue={""}
                                  onChange={(e) => setComment(e.target.value)}
                                  disabled={data.ticket.locked}
                                />
                              </div>
                              <div className="mt-4 flex justify-end">
                                <Text as="label" size="2">
                                  <div className="flex flex-row items-center space-x-2">
                                    <Switch
                                      checked={publicComment}
                                      onChange={setPublicComment}
                                      className={`${
                                        publicComment
                                          ? "bg-blue-600"
                                          : "bg-gray-200"
                                      } relative inline-flex h-6 w-11 items-center rounded-full`}
                                    >
                                      <span className="sr-only">
                                        {t("enable_notifications")}
                                      </span>
                                      <span
                                        className={`${
                                          publicComment
                                            ? "translate-x-6"
                                            : "translate-x-1"
                                        } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                                      />
                                    </Switch>
                                    <Tooltip content={t("label_enable_send_to_user")}>
                                      <Text> {t("send_to_user")}</Text>
                                    </Tooltip>
                                  </div>
                                </Text>
                              </div>
                              <div className="mt-4 flex items-center justify-end space-x-4">
                                {data.ticket.isComplete ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!data.ticket.locked) {
                                        updateStatus();
                                      }
                                    }}
                                    disabled={data.ticket.locked}
                                    className={`inline-flex justify-center items-center gap-x-1.5 rounded-md ${
                                      data.ticket.locked
                                        ? "bg-gray-300 cursor-not-allowed"
                                        : "bg-white hover:bg-gray-50"
                                    } px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300`}
                                  >
                                    <CheckCircleIcon
                                      className="-ml-0.5 h-5 w-5 text-red-500"
                                      aria-hidden="true"
                                    />
                                    <span className="">
                                      {t("reopen_issue")}
                                    </span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!data.ticket.locked) {
                                        updateStatus();
                                      }
                                    }}
                                    disabled={data.ticket.locked}
                                    className={`inline-flex justify-center gap-x-1.5 rounded-md ${
                                      data.ticket.locked
                                        ? "bg-gray-300 cursor-not-allowed"
                                        : "bg-white hover:bg-gray-50"
                                    } px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300`}
                                  >
                                    <CheckCircleIcon
                                      className="-ml-0.5 h-5 w-5 text-green-500"
                                      aria-hidden="true"
                                    />
                                    {t("close_issue")}
                                  </button>
                                )}
                                <button
                                  onClick={() => addComment()}
                                  type="submit"
                                  disabled={data.ticket.locked}
                                  className={`inline-flex items-center justify-center rounded-md px-4 py-1.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 ${
                                    data.ticket.locked
                                      ? "bg-gray-400 cursor-not-allowed"
                                      : "bg-gray-900 hover:bg-gray-700"
                                  }`}
                                >
                                  {t("comment")}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
            <div className="hidden xl:block xl:pl-8 xl:order-2 order-1">
              <h2 className="sr-only">{t("details")}</h2>
              <div className="space-y-1   py-2">
                {users && (
                  <UserCombo
                    value={users}
                    update={setN}
                    defaultName={
                      data.ticket.assignedTo ? data.ticket.assignedTo.name : ""
                    }
                    disabled={data.ticket.locked}
                  />
                )}

                <IconCombo
                  value={priorityOptions}
                  update={setPriority}
                  defaultName={data.ticket.priority ? data.ticket.priority : ""}
                  disabled={data.ticket.locked}
                />

                <IconCombo
                  value={ticketStatusMap}
                  update={setTicketStatus}
                  defaultName={data.ticket.status ? data.ticket.status : ""}
                  disabled={data.ticket.locked}
                />

                {/* <div className="border-t border-gray-200">
                  <div className="flex flex-row items-center justify-between mt-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-white">
                      Time Tracking
                    </span>
                    {!editTime ? (
                      <button
                        onClick={() => setTimeEdit(true)}
                        className="text-sm font-medium text-gray-500 hover:underline dark:text-white"
                      >
                        add
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setTimeEdit(false);
                          addTime();
                        }}
                        className="text-sm font-medium text-gray-500 hover:underline dark:text-white"
                      >
                        save
                      </button>
                    )}
                  </div>
                  {data.ticket.TimeTracking.length > 0 ? (
                    data.ticket.TimeTracking.map((i: any) => (
                      <div key={i.id} className="text-xs">
                        <div className="flex flex-row space-x-1.5 items-center dark:text-white">
                          <span>{i.user.name} / </span>
                          <span>{i.time} minutes</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div>
                      <span className="text-xs dark:text-white">
                        No Time added
                      </span>
                    </div>
                  )}
                  {editTime && (
                    <div>
                      <div className="mt-2 flex flex-col space-y-2">
                        <input
                          type="text"
                          name="text"
                          id="timespent_text"
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          placeholder="What did you do?"
                          value={timeReason}
                          onChange={(e) => setTimeReason(e.target.value)}
                        />
                        <input
                          type="number"
                          name="number"
                          id="timespent"
                          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          placeholder="Time in minutes"
                          value={timeSpent}
                          onChange={(e) => setTimeSpent(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div> */}
                {/* <div className="border-t border-gray-200">
                  <div className="flex flex-row items-center justify-between mt-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-white">
                      Attachments
                    </span>
                    <button
                      className="text-sm font-medium text-gray-500 hover:underline dark:text-white"
                      onClick={handleButtonClick}
                    >
                      upload
                      <input
                        id="file"
                        type="file"
                        hidden
                        ref={fileInputRef}
                        onChange={handleFileChange}
                      />
                    </button>
                  </div>

                  <>
                    {data.ticket.files.length > 0 &&
                      data.ticket.files.map((file: any) => (
                        <div className="p-1/2 px-1  hover:bg-gray-200 hover:cursor-pointer">
                          <span className="text-xs">{file.filename}</span>
                        </div>
                      ))}
                    {file && (
                      <div className="p-1/2 px-1">
                        <span className="text-xs">{file.name}</span>
                      </div>
                    )}
                  </>
                </div> */}
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
