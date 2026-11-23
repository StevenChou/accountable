class ApiError(Exception):
    def __init__(self, status: int, message: str, **details):
        super().__init__(message)
        self.status = status
        self.body = {"message": message, **details}


def missing():
    return ApiError(404, "找不到這筆紀錄，可能已刪除。")


def invalid(field: str, message: str):
    return ApiError(422, "請檢查標示的欄位。", fields={field: message})
