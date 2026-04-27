package com.example.library.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    private String username;

    private String passwordHash;

    @Builder.Default
    private List<Role> roles = List.of(Role.MEMBER);

    /** Books currently borrowed by this user, with their borrow timestamps. */
    @Builder.Default
    private List<BorrowRecord> borrowedRecords = new ArrayList<>();
}
